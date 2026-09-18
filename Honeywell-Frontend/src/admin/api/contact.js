import { contactService } from '../../services/contactService';

/** GET /api/contact — Fetch all live contact submissions */
export const getContactSubmissions = async () => {
  return await contactService.getAll();
};

/** GET /api/contact/{id} — Fetch single contact submission by ID */
export const getContactSubmissionById = async (id) => {
  return await contactService.getById(id);
};

/** POST /api/contact — Create a new contact submission */
export const createContactSubmission = async (payload) => {
  return await contactService.submit(payload);
};

/** PUT /api/contact/{id} — Update contact submission details/status */
export const updateContactSubmissionStatus = async (id, updateData) => {
  return await contactService.update(id, updateData);
};

/** DELETE /api/contact/{id} — Delete a contact submission */
export const deleteContactSubmission = async (id) => {
  return await contactService.delete(id);
};
