# AI_AUDIT_LOG.md — Cá nhân DE191087

---

# Log #01

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Generate the Booking List page with pagination and search functionality using React Bootstrap.
- **Prompt Reference:** PROMPTS.md#prompt-46
- **AI Output Summary:** Generated a responsive booking list page with table, search box, pagination, and API integration example.
- **Human Decision:** Adjusted table columns and updated the API endpoint to match the project.
- **Applied To:** BookingList.jsx
- **Verification:** Tested booking list display, search function, and pagination with sample data.

# Log #02

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Create a Booking Detail page displaying customer and booking information.
- **Prompt Reference:** PROMPTS.md#prompt-47
- **AI Output Summary:** Generated a detailed booking information page with responsive layout.
- **Human Decision:** Modified the UI to match the project design.
- **Applied To:** BookingDetail.jsx
- **Verification:** Verified all booking information is displayed correctly.

# Log #03

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Generate a Create Booking form using React Bootstrap.
- **Prompt Reference:** PROMPTS.md#prompt-48
- **AI Output Summary:** Generated booking form with validation and submit handling.
- **Human Decision:** Added required fields and adjusted validation rules.
- **Applied To:** CreateBooking.jsx
- **Verification:** Successfully created new bookings with valid input.

# Log #04

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Generate an Edit Booking feature.
- **Prompt Reference:** PROMPTS.md#prompt-49
- **AI Output Summary:** Generated editable booking form with PUT API example.
- **Human Decision:** Updated API endpoint and improved form layout.
- **Applied To:** EditBooking.jsx
- **Verification:** Confirmed booking information updates correctly.

# Log #05

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Create booking cancellation confirmation dialog.
- **Prompt Reference:** PROMPTS.md#prompt-50
- **AI Output Summary:** Generated Bootstrap confirmation modal before cancelling booking.
- **Human Decision:** Customized confirmation message for better UX.
- **Applied To:** CancelBooking.jsx
- **Verification:** Verified cancellation only occurs after user confirmation.

# Log #06

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Generate booking form validation rules.
- **Prompt Reference:** PROMPTS.md#prompt-51
- **AI Output Summary:** Generated validation for required fields, dates, and customer information.
- **Human Decision:** Updated validation messages based on project requirements.
- **Applied To:** BookingValidation.js
- **Verification:** Tested valid, invalid, and empty input scenarios.

# Log #07

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Implement booking status management.
- **Prompt Reference:** PROMPTS.md#prompt-52
- **AI Output Summary:** Generated booking status badges for Pending, Confirmed, Completed, and Cancelled.
- **Human Decision:** Updated colors to match the project UI.
- **Applied To:** BookingStatus.jsx
- **Verification:** Verified correct status is displayed for each booking.

# Log #08

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Implement booking search functionality.
- **Prompt Reference:** PROMPTS.md#prompt-53
- **AI Output Summary:** Generated search function by booking ID and customer name.
- **Human Decision:** Optimized keyword filtering performance.
- **Applied To:** BookingList.jsx
- **Verification:** Tested multiple search keywords successfully.

# Log #09

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Create booking filter by date and status.
- **Prompt Reference:** PROMPTS.md#prompt-54
- **AI Output Summary:** Generated dropdown filters and date picker components.
- **Human Decision:** Adjusted filter options according to project requirements.
- **Applied To:** BookingFilter.jsx
- **Verification:** Verified filtering results under different conditions.

# Log #10

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Generate Axios integration for Booking API.
- **Prompt Reference:** PROMPTS.md#prompt-55
- **AI Output Summary:** Generated API service with loading and error handling.
- **Human Decision:** Updated API routes based on backend implementation.
- **Applied To:** bookingService.js
- **Verification:** Successfully retrieved booking data from the backend.

# Log #11

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Design Booking History page.
- **Prompt Reference:** PROMPTS.md#prompt-56
- **AI Output Summary:** Generated booking history interface with timeline ordering.
- **Human Decision:** Sorted records by newest first.
- **Applied To:** BookingHistory.jsx
- **Verification:** Verified booking history displays correctly.

# Log #12

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Display notifications after booking operations.
- **Prompt Reference:** PROMPTS.md#prompt-57
- **AI Output Summary:** Generated Bootstrap Toast notifications for success and failure events.
- **Human Decision:** Adjusted notification duration and styling.
- **Applied To:** Notification.jsx
- **Verification:** Confirmed notifications appear after create and cancel actions.

# Log #13

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Improve Booking API error handling.
- **Prompt Reference:** PROMPTS.md#prompt-58
- **AI Output Summary:** Generated standardized API error handling and alert messages.
- **Human Decision:** Customized messages for user-friendly feedback.
- **Applied To:** bookingService.js
- **Verification:** Tested API failure scenarios successfully.

# Log #14

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Generate Booking Management test cases.
- **Prompt Reference:** PROMPTS.md#prompt-59
- **AI Output Summary:** Generated functional and negative test cases for booking operations.
- **Human Decision:** Added boundary value and exception test cases.
- **Applied To:** TEST_CASES.md
- **Verification:** Executed manual testing based on generated test cases.

# Log #15

- **Date:** 2026-05-21
- **Author:** DE191087
- **AI Tool:** ChatGPT
- **Purpose:** Review the Booking Management module and recommend improvements.
- **Prompt Reference:** PROMPTS.md#prompt-60
- **AI Output Summary:** Suggested code refactoring, reusable components, and API optimization.
- **Human Decision:** Applied selected improvements after code review.
- **Applied To:** Booking Module
- **Verification:** Confirmed the module works correctly after refactoring.
