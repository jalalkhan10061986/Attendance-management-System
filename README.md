Attendly – Attendance Management System
A simple, responsive, browser-based attendance management system for schools and training centers, built using HTML5, CSS3, Vanilla JavaScript, and JSON — without any frameworks, external libraries, or backend server.

🔗 Live Demo: Attendly – Attendance Management System

📌 Overview
Attendly is a web-based application designed to simplify student attendance management. It provides an intuitive dashboard where administrators and teachers can manage students and classes, record daily attendance, review attendance history, and generate monthly reports.

The application features a modern dashboard interface with a dark sidebar, a clean header, colorful statistic cards, responsive layouts, and light and dark themes.

All application data is stored locally in the browser using localStorage, while the initial sample dataset is loaded from data.json.

✨ Features
🔐 1. Authentication
Client-side login for administrators and teachers.
Demo user credentials stored in the JSON dataset.
Session management using browser session storage.
Logout option available in the application header.
📊 2. Dashboard
Overview cards displaying total students, present, absent, and late counts.
Automatically displays today's attendance or the latest marked day.
Low-attendance student list for students below 75%.
CSS-based bar chart showing attendance percentages over the last seven marked days.
👨‍🎓 3. Student Management
Add, edit, and delete student records.
Manage student ID, name, class, email, and phone number.
Validate required fields, duplicate IDs, email addresses, and phone numbers.
Automatically remove a student's attendance records when the student is deleted, after confirmation.
🏫 4. Class Management
Create, rename, and delete classes.
Display the number of students assigned to each class.
Prevent deletion of classes that still contain students.
Assign students to classes through the student management form.
📝 5. Take Attendance
Select a class and attendance date.
Mark students as Present, Absent, Late, or Leave.
Use color-coded status dropdowns for easy identification.
Mark the entire class present with one click.
Update existing attendance records when the same class and date are saved again.
Validate attendance dates and prevent duplicate class-date records.
📅 6. Attendance Records
View and review saved attendance history.
Filter records by date range, class, status, student name, or student ID.
Identify attendance statuses using consistent colors:
🟢 Present
🔴 Absent
🟠 Late
🔵 Leave
📈 7. Reports
Generate monthly attendance reports for individual students.
View present, absent, late, and leave counts.
Calculate monthly and overall attendance percentages.
Highlight students with attendance below 75%.
Filter reports by month, class, student, and low attendance.
Export filtered reports to CSV.
Attendance calculation:

Attendance Percentage = ((Present + Late) / Total Marked Days) × 100

🔎 8. Search, Sorting, Filtering & Pagination
Search students by name, ID, email, phone, or class.
Search attendance records and reports.
Filter by class, status, date range, and attendance percentage.
Sort table columns in ascending or descending order.
Support natural sorting for student IDs.
Select 5, 10, 25, or 50 rows per page.
Navigate between pages using page numbers and Previous/Next controls.
Automatically return to the first page when filters change.
Display helpful messages when no matching results are found.
💾 9. Data Management
Save changes in browser localStorage.
Export the complete dataset as a JSON backup.
Import JSON files with structural validation.
Restore the original sample data using the reset option.
🎨 10. User Interface & Accessibility
Responsive dashboard with mobile-friendly navigation.
Sidebar navigation for Dashboard, Students, Classes, Take Attendance, Records, Reports, and Settings.
Light and dark mode with saved theme preferences.
Toast notifications for successful operations and errors.
Confirmation dialogs before destructive actions.
Accessible form labels and visible keyboard focus indicators.
ARIA attributes for sorting and current-page navigation.
Reduced-motion support for users who prefer less animation.
🛠️ Tech Stack

Layer	Technology
Structure	HTML5
Styling	CSS3, Flexbox, Grid, CSS Variables
Application Logic	Vanilla JavaScript (ES6+)
Initial Data	JSON
Local Persistence	Browser localStorage
Session Management	Browser sessionStorage
Deployment	GitHub Pages
No frameworks. No external libraries. No backend server required.

📂 Project Structure

attendance-system/
├── index.html   # Login screen and application shell
├── style.css    # Themes, layouts, tables, and responsive styles
├── script.js    # Authentication, storage, calculations, and UI logic
├── data.json    # Initial sample data
└── README.md    # Project documentation
🚀 Getting Started
Prerequisites
You need a modern web browser and a local HTTP server. No package installation or build tools are required.

1. Clone the Repository

git clone https://github.com/jalalkhan10061986/Attendance-management-System.git
2. Navigate to the Project Directory

cd Attendance-management-System
3. Start a Local Server
Because the application loads data.json using JavaScript's fetch() API, it should be served over HTTP rather than opened directly using a file:// URL.

Option A: VS Code Live Server

Open the project folder in Visual Studio Code.
Install the Live Server extension if necessary.
Right-click index.html.
Select Open with Live Server.
Option B: Python HTTP Server

If Python is installed, run:


python -m http.server 8000
Then open the following URL in your browser:

http://localhost:8000

4. Log In
Use one of the demo accounts below to explore the application.

🔑 Demo Credentials

Role / User	Username	Password
Admin	admin	admin123
Teacher	teacher	teach123
Teacher	sara	sara123
Note: These are demonstration credentials, not secure production accounts. Authentication is handled entirely on the client side.

🧪 Sample Data
The project includes sample data so you can explore the features immediately.

3 demo users.
4 classes: Grade 9-A, Grade 9-B, Grade 10-A, and Grade 10-B.
32 students.
88 attendance records covering the last 30 days, with weekends skipped.
4 students deliberately placed below the 75% attendance threshold to demonstrate warnings and dashboard indicators.
You can modify the sample records, export a backup, import data, or restore the original dataset through the Settings page.

📐 Attendance Calculation
Attendly calculates attendance percentages using present and late days as attended days.


Attendance Percentage =
    ((Present Days + Late Days) / Total Marked Days) × 100
For example, if a student has 18 present days, 2 late days, and 5 absent days:


Attendance Percentage = ((18 + 2) / 25) × 100
                      = 80%
Students whose attendance falls below 75% are flagged in the dashboard and reports.

Leave days are included in the total marked days under the stated calculation.

💽 Data Storage
Attendly uses two browser storage mechanisms:

data.json — provides the initial sample dataset.
localStorage — stores application data and preserves changes between visits.
sessionStorage — supports browser-tab session management.
Since the data is stored locally, changes are specific to the browser and device being used. Clearing browser storage may remove saved changes.

Use the JSON export feature to create backups before resetting data or importing another dataset.

⚠️ Limitations
Attendly is intended for educational purposes, demonstrations, and personal learning.

Client-side authentication: User credentials are stored in plain text in the JSON data.
No backend security: Client-side login does not provide secure authentication or authorization.
Local data only: Attendance records are not automatically shared across browsers or devices.
No centralized database: There is no server-side database or synchronization.
JSON import limitations: Imported data must match the expected application structure.
GitHub Pages deployment: GitHub Pages serves static files and does not provide a backend for secure authentication or centralized data storage.
Do not use the current version to store sensitive student information or manage real institutional attendance without appropriate security improvements.

🔮 Future Improvements
Potential enhancements for future versions include:

Backend integration using Node.js and Express, Django, or Laravel.
Database integration using MySQL, PostgreSQL, or MongoDB.
Secure authentication with password hashing and server-side sessions.
Role-based permissions for administrators and teachers.
Class-specific access for teachers.
Cloud-based storage and multi-device synchronization.
QR-code attendance check-in.
Automated email notifications for parents.
Printable PDF attendance reports.
Advanced analytics and interactive report charts.
Attendance audit logs and change history.
🤝 Contributing
Contributions, suggestions, and bug reports are welcome!

Fork the repository.
Create a feature branch:

git checkout -b feature/your-feature
Commit your changes:

git commit -m "Add your feature"
Push your branch:

git push origin feature/your-feature
Open a Pull Request describing your changes.
📄 License
No license has been specified yet. Unless a license is added to the repository, the project should not be assumed to be available for unrestricted reuse, modification, or redistribution.

👨‍💻 Author
Jalal Khan

GitHub: @jalalkhan10061986
Live Project: Attendly – Attendance Management System
⭐ If you find Attendly useful, consider starring the repository on GitHub!

Before publishing
A few recommendations to make your GitHub repository look more professional:

Add screenshots: Capture the dashboard, student management page, attendance screen, and reports page. Place them in a screenshots/ folder and embed them in the README.

Verify the repository URL: The clone command assumes your repository is jalalkhan10061986/Attendance-management-System.

Add a license: If you want others to reuse or modify the project, consider adding an MIT License.

Keep demo credentials for testing only: Avoid using real passwords or sensitive student information in the public repository.
