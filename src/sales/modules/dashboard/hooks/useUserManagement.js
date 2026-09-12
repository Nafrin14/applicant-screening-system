import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../../../../core/lib/supabase';
import { isSalesCompanyEmail, SALES_EMAIL_DOMAIN } from '../../../utils/validation';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SALES_ADMIN_API = `${API_BASE}/api/sales-admin`;

// Sales user accounts are created/edited through the server-side Admin API
// (server/routes/salesAdmin.js) instead of the client-side signUp()/
// resetPasswordForEmail() calls this hook used before. That lets the admin
// set a working password directly and log the user in immediately, with no
// invitation, OTP, or email-confirmation step.
async function callSalesAdminApi(path, body) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error('Your admin session has expired. Please log in again.');
  }

  try {
    const res = await axios.post(`${SALES_ADMIN_API}${path}`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    const serverMessage = err.response?.data?.error;
    throw new Error(serverMessage || err.message || 'Request to the server failed.', { cause: err });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Create / edit / delete for sales-rep user accounts, plus the form state
// backing the "user-form" tab. `refetch` reloads the admin dashboard's
// data after a mutation; `setActiveTab` switches tabs the same way the
// dashboard did inline before this was extracted.
// ─────────────────────────────────────────────────────────────────────────
export default function useUserManagement(refetch, { notify, confirmDialog, showToast, setActiveTab }) {
  const [isEditing, setIsEditing] = useState(false);
  const [targetUserId, setTargetUserId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formResetPassword, setFormResetPassword] = useState('');

  const handleOpenCreateMode = () => {
    setIsEditing(false);
    setTargetUserId(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormResetPassword('');
    setActiveTab('user-form');
  };

  const handleOpenEditMode = (user) => {
    console.log("✏️ Editing user:", user);
    if (!user || !user.id) {
      notify('Invalid user data', { type: 'error' });
      return;
    }
    setIsEditing(true);
    setTargetUserId(user.id);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormPassword('');
    setFormResetPassword('');
    setActiveTab('user-form');
  };

  const handleSaveUserForm = async (e) => {
    e.preventDefault();

    if (!formName.trim()) {
      notify('Please enter a name.', { type: 'error' });
      return;
    }

    if (!isSalesCompanyEmail(formEmail)) {
      notify(`Sales users must use a company email ending in @${SALES_EMAIL_DOMAIN}.`, { type: 'error' });
      return;
    }

    try {
      if (isEditing) {
        if (!targetUserId) {
          notify('No user selected for editing', { type: 'error' });
          return;
        }

        console.log("📝 Updating user:", targetUserId, { name: formName, email: formEmail });

        await callSalesAdminApi('/users/update', {
          id: targetUserId,
          name: formName.trim(),
          email: formEmail.trim(),
        });

        if (formResetPassword.trim().length > 0) {
          if (formResetPassword.trim().length < 6) {
            notify('Password must be at least 6 characters.', { type: 'error' });
            return;
          }
          await callSalesAdminApi('/users/set-password', {
            id: targetUserId,
            password: formResetPassword.trim(),
          });
          showToast(`Password updated for: ${formEmail}`);
        } else {
          showToast(`User details saved for: ${formEmail}`);
        }
      } else {
        if (!formPassword || formPassword.trim().length < 6) {
          notify('Password must be at least 6 characters.', { type: 'error' });
          return;
        }

        console.log("➕ Creating new user:", { email: formEmail, name: formName });

        await callSalesAdminApi('/users/create', {
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
        });

        showToast(`New user created: ${formEmail}`);
      }

      setActiveTab('users');
      await refetch();
    } catch(err) {
      console.error("❌ Save user error:", err);
      notify(err.message || 'Failed to save user. Please check console for details.', { type: 'error' });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!(await confirmDialog('Delete this user?', { danger: true, confirmLabel: 'Delete' }))) return;

    try {
      console.log("🗑️ Deleting user:", id);

      const { data: user, error: checkError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error("❌ User not found:", checkError);
        notify('User not found in database.', { type: 'error' });
        return;
      }

      console.log("Found user to delete:", user);

      await callSalesAdminApi('/users/deactivate', { id });

      showToast(`User ${user.name || user.email || 'deleted'} successfully.`);
      await refetch();
    } catch(err) {
      console.error("❌ Delete error:", err);
      notify('Error deleting user: ' + err.message, { type: 'error' });
    }
  };

  return {
    isEditing,
    targetUserId,
    formName, setFormName,
    formEmail, setFormEmail,
    formPassword, setFormPassword,
    formResetPassword, setFormResetPassword,
    handleOpenCreateMode,
    handleOpenEditMode,
    handleSaveUserForm,
    handleDeleteUser,
  };
}
