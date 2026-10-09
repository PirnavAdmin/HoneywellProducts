import { enquiryService } from '../../services/enquiryService';

/** GET /api/enquiries — Fetch all live enquiries */
export const getEnquiries = async () => {
  return await enquiryService.getAll();
};

/** GET /api/enquiries/{id} — Fetch single enquiry by ID */
export const getEnquiryById = async (id) => {
  return await enquiryService.getById(id);
};

/** POST /api/enquiries — Create a new enquiry */
export const createEnquiry = async (payload) => {
  return await enquiryService.submit(payload);
};

/** PUT /api/enquiries/{id} — Update enquiry details/status */
export const updateEnquiry = async (id, updateData) => {
  return await enquiryService.update(id, updateData);
};

/** DELETE /api/enquiries/{id} — Delete an enquiry */
export const deleteEnquiry = async (id) => {
  return await enquiryService.delete(id);
};
