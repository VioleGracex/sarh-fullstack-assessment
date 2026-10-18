# UI Standard: Zero Browser Alerts & Prompts

Strict project rule:

---

## 1. Absolute Prohibition of Browser Native Dialogs
- **NEVER use `alert()` or `window.alert()`**.
- **NEVER use `confirm()` or `window.confirm()`**.
- **NEVER use `prompt()` or `window.prompt()`**.

---

## 2. In-App Replacement Patterns
All user messages, errors, warnings, and confirmations must exist strictly within the application DOM:
- **Deletion / Mutation Confirmations**: Use `<ConfirmModal />`.
- **Status / Operation Alerts**: Use the `<Toast />` system or inline form alerts.
- **Form Errors**: Inline field error spans and form-level banners.
