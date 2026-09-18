using System.Collections.Generic;
using System.Threading.Tasks;
using Honeywell.DTOs.Blog;

namespace Honeywell.Services.Interfaces
{
    public interface IBlogService
    {
        Task<IEnumerable<BlogResponseDto>> GetAllAsync();

        Task<BlogResponseDto?> GetByIdAsync(int id);

        Task<BlogResponseDto> CreateAsync(CreateBlogDto dto);

        Task<bool> UpdateAsync(int id, UpdateBlogDto dto);

        Task<bool> DeleteAsync(int id);
    }
}
