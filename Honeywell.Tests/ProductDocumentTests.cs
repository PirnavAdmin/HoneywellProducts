using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Honeywell.Data;
using Honeywell.DTOs.Catalog;
using Honeywell.Models;
using Honeywell.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Honeywell.Tests
{
    public class ProductDocumentTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly ProductDocumentService _service;
        private readonly string _testUploadDir;
        private readonly Product _testProduct;

        public ProductDocumentTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);

            _testUploadDir = Path.Combine(Path.GetTempPath(), "HoneywellDocTests_" + Guid.NewGuid());
            Directory.CreateDirectory(_testUploadDir);

            var inMemoryConfig = new Dictionary<string, string?>
            {
                { "DocumentUpload:Path", _testUploadDir },
                { "DocumentUpload:MaxSizeMb", "10" },
                { "DocumentUpload:AllowedExtensions:0", ".pdf" }
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemoryConfig)
                .Build();

            _service = new ProductDocumentService(_context, configuration);

            var category = new Category { Id = 1, Name = "CCTV Cameras" };
            _context.Categories.Add(category);

            _testProduct = new Product
            {
                Id = 1,
                ProductName = "Honeywell 4K Bullet Camera",
                SKU = "HC30WB4R2",
                CategoryId = 1,
                Category = category,
                IsActive = true
            };
            _context.Products.Add(_testProduct);
            _context.SaveChanges();
        }

        private static IFormFile CreateDummyPdfFile(string fileName, string content = "Sample PDF Content")
        {
            // Valid PDF header "%PDF-1.4\n"
            var header = Encoding.ASCII.GetBytes("%PDF-1.4\n");
            var body = Encoding.UTF8.GetBytes(content);
            var fullBytes = new byte[header.Length + body.Length];
            Buffer.BlockCopy(header, 0, fullBytes, 0, header.Length);
            Buffer.BlockCopy(body, 0, fullBytes, header.Length, body.Length);

            var stream = new MemoryStream(fullBytes);
            return new FormFile(stream, 0, fullBytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "application/pdf"
            };
        }

        private static IFormFile CreateInvalidFakePdfFile(string fileName)
        {
            // Fake file without %PDF- magic bytes
            var fakeBytes = Encoding.UTF8.GetBytes("This is NOT a PDF file content");
            var stream = new MemoryStream(fakeBytes);
            return new FormFile(stream, 0, fakeBytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "application/pdf"
            };
        }

        [Fact]
        public async Task CreateAsync_ValidPdf_SavesDocumentAndFileSuccessfully()
        {
            var file = CreateDummyPdfFile("H4W2PER2-datasheet.pdf");
            var dto = new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Datasheets",
                Title = "Honeywell 4K Camera Official Datasheet",
                Description = "Complete technical specifications",
                Revision = "v1.0",
                Language = "English"
            };

            var result = await _service.CreateAsync(dto, file, "admin@honeywell.com");

            Assert.NotNull(result);
            Assert.True(result.Id > 0);
            Assert.Equal("Datasheets", result.Category);
            Assert.Equal("Honeywell 4K Camera Official Datasheet", result.Title);
            Assert.Equal("v1.0", result.Revision);
            Assert.Equal($"/api/documents/{result.Id}/download", result.FileUrl);

            var dbDoc = await _context.ProductDocuments.FindAsync(result.Id);
            Assert.NotNull(dbDoc);
            Assert.NotNull(dbDoc.StoredFileName);

            var filePath = Path.Combine(_testUploadDir, dbDoc.StoredFileName);
            Assert.True(File.Exists(filePath));
        }

        [Fact]
        public async Task CreateAsync_InvalidMagicBytes_ThrowsArgumentException()
        {
            var fakeFile = CreateInvalidFakePdfFile("malicious.pdf");
            var dto = new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "User Manuals",
                Title = "User Guide"
            };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateAsync(dto, fakeFile, "admin@honeywell.com"));

            Assert.Contains("not a valid PDF", ex.Message);
        }

        [Fact]
        public async Task CreateAsync_DisallowedExtension_ThrowsArgumentException()
        {
            var bytes = Encoding.UTF8.GetBytes("test");
            var stream = new MemoryStream(bytes);
            var file = new FormFile(stream, 0, bytes.Length, "file", "document.exe")
            {
                Headers = new HeaderDictionary(),
                ContentType = "application/octet-stream"
            };

            var dto = new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Certifications",
                Title = "Certificate"
            };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateAsync(dto, file, "admin@honeywell.com"));

            Assert.Contains("not permitted", ex.Message);
        }

        [Fact]
        public async Task GetByProductIdAsync_ReturnsOnlyDocumentsForTargetProduct()
        {
            var doc1 = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Datasheets",
                Title = "Doc 1"
            }, CreateDummyPdfFile("doc1.pdf"), "admin@honeywell.com");

            var otherProduct = new Product { Id = 2, ProductName = "NVR", SKU = "HEN16104", CategoryId = 1, IsActive = true };
            _context.Products.Add(otherProduct);
            await _context.SaveChangesAsync();

            var doc2 = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = otherProduct.Id,
                Category = "User Manuals",
                Title = "Doc 2"
            }, CreateDummyPdfFile("doc2.pdf"), "admin@honeywell.com");

            var results1 = await _service.GetByProductIdAsync(_testProduct.Id, isAdmin: false);
            Assert.Single(results1);
            Assert.Equal("Doc 1", results1[0].Title);

            var results2 = await _service.GetByProductIdAsync(otherProduct.Id, isAdmin: false);
            Assert.Single(results2);
            Assert.Equal("Doc 2", results2[0].Title);
        }

        [Fact]
        public async Task UpdateAsync_ReplacesPhysicalFileSafely()
        {
            var file1 = CreateDummyPdfFile("original.pdf", "Original PDF content");
            var created = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Brochures",
                Title = "Original Brochure"
            }, file1, "admin@honeywell.com");

            var dbDoc1 = await _context.ProductDocuments.FindAsync(created.Id);
            var oldFileName = dbDoc1!.StoredFileName!;
            var oldFilePath = Path.Combine(_testUploadDir, oldFileName);
            Assert.True(File.Exists(oldFilePath));

            // Replace with new file
            var file2 = CreateDummyPdfFile("updated.pdf", "New and Updated PDF content");
            var updated = await _service.UpdateAsync(created.Id, new UpdateProductDocumentDto
            {
                Category = "Brochures",
                Title = "Updated Brochure 2026",
                KeepExistingFile = false
            }, file2, "admin@honeywell.com");

            Assert.NotNull(updated);
            Assert.Equal("Updated Brochure 2026", updated.Title);

            // Verify old file deleted and new file exists
            Assert.False(File.Exists(oldFilePath));

            var dbDoc2 = await _context.ProductDocuments.FindAsync(created.Id);
            var newFilePath = Path.Combine(_testUploadDir, dbDoc2!.StoredFileName!);
            Assert.True(File.Exists(newFilePath));
        }

        [Fact]
        public async Task DeleteAsync_DeletesDatabaseRecordAndPhysicalFile()
        {
            var file = CreateDummyPdfFile("to-delete.pdf");
            var created = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Certifications",
                Title = "ISO Certificate"
            }, file, "admin@honeywell.com");

            var dbDoc = await _context.ProductDocuments.FindAsync(created.Id);
            var filePath = Path.Combine(_testUploadDir, dbDoc!.StoredFileName!);
            Assert.True(File.Exists(filePath));

            var deleted = await _service.DeleteAsync(created.Id);
            Assert.True(deleted);

            Assert.Null(await _context.ProductDocuments.FindAsync(created.Id));
            Assert.False(File.Exists(filePath));
        }

        [Fact]
        public async Task GetDownloadAsync_IncrementsDownloadCount()
        {
            var file = CreateDummyPdfFile("download-test.pdf");
            var created = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Technical Documents",
                Title = "Wiring Schematic"
            }, file, "admin@honeywell.com");

            var (bytes, mime, fileName) = await _service.GetDownloadAsync(created.Id, isAdmin: false);
            Assert.NotNull(bytes);
            Assert.True(bytes.Length > 0);
            Assert.Equal("application/pdf", mime);

            var dbDoc = await _context.ProductDocuments.FindAsync(created.Id);
            Assert.Equal(1, dbDoc!.DownloadCount);

            // Second download
            await _service.GetDownloadAsync(created.Id, isAdmin: false);
            dbDoc = await _context.ProductDocuments.FindAsync(created.Id);
            Assert.Equal(2, dbDoc!.DownloadCount);
        }

        [Fact]
        public async Task NonAdmin_CannotAccessInactiveDocuments()
        {
            var file = CreateDummyPdfFile("confidential.pdf");
            var created = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Datasheets",
                Title = "Unpublished Datasheet",
                Status = "Inactive"
            }, file, "admin@honeywell.com");

            // Non-admin query by ID
            var nonAdminGet = await _service.GetByIdAsync(created.Id, isAdmin: false);
            Assert.Null(nonAdminGet);

            // Admin query by ID
            var adminGet = await _service.GetByIdAsync(created.Id, isAdmin: true);
            Assert.NotNull(adminGet);

            // Non-admin download
            var (bytes, _, _) = await _service.GetDownloadAsync(created.Id, isAdmin: false);
            Assert.Null(bytes);

            // Admin download
            var (adminBytes, _, _) = await _service.GetDownloadAsync(created.Id, isAdmin: true);
            Assert.NotNull(adminBytes);
        }

        [Fact]
        public async Task GetByProductIdAsync_ProductWithoutDocuments_ReturnsEmptyList()
        {
            var productWithoutDocs = new Product { Id = 99, ProductName = "Camera Stand", SKU = "STAND-01", CategoryId = 1, IsActive = true };
            _context.Products.Add(productWithoutDocs);
            await _context.SaveChangesAsync();

            var docs = await _service.GetByProductIdAsync(productWithoutDocs.Id, isAdmin: false);
            Assert.NotNull(docs);
            Assert.Empty(docs);
        }

        [Fact]
        public async Task CreateAsync_MultipleDocumentsSameCategory_SavesAllDocuments()
        {
            var doc1 = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Datasheets",
                Title = "Datasheet Rev A - English"
            }, CreateDummyPdfFile("datasheet-en.pdf"), "admin@honeywell.com");

            var doc2 = await _service.CreateAsync(new CreateProductDocumentDto
            {
                ProductId = _testProduct.Id,
                Category = "Datasheets",
                Title = "Datasheet Rev B - Spanish"
            }, CreateDummyPdfFile("datasheet-es.pdf"), "admin@honeywell.com");

            var results = await _service.GetByProductIdAsync(_testProduct.Id, isAdmin: true);
            var datasheets = results.Where(d => d.Category == "Datasheets").ToList();

            Assert.Equal(2, datasheets.Count);
            Assert.Contains(datasheets, d => d.Title == "Datasheet Rev A - English");
            Assert.Contains(datasheets, d => d.Title == "Datasheet Rev B - Spanish");
        }

        public void Dispose()
        {
            _context.Dispose();
            if (Directory.Exists(_testUploadDir))
            {
                try { Directory.Delete(_testUploadDir, true); } catch { }
            }
        }
    }
}
