PeerGrade
Blind Double-Peer Academic Assessment & Calibration Matrix
PeerGrade is a full-stack academic peer-assessment application designed to help instructors create assignments, collect student submissions, allocate blind peer reviews, review scoring patterns, calculate draft grades, and release final results.
Features
- Authentication and role-based access for students, instructors, and administrators.
- Assignment management for instructors, including assignment details, rubrics, maximum marks, and deadlines.
- Student submissions for published assignments.
- Blind peer-review allocation that prevents students from reviewing their own submissions.
- Rubric-based reviews with marks and written feedback.
- Calibration dashboard for instructors to inspect peer-review activity and scoring patterns.
- Draft grade calculation based on completed peer reviews.
- Instructor feedback and grade release through the Grade Management page.
- Student results showing released grades.
- Admin dashboard for user administration.
Note: Features available in your local copy depend on the backend routes, frontend pages, and models currently implemented. See the testing checklist below to verify each workflow.

Technology Stack
Frontend
- React
- Vite
- React Router
- Axios
Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT-based authentication
- bcrypt/bcryptjs for password hashing (depending on the installed package)
Project Structure
The project is organized into separate frontend and backend applications. Your exact folder contents may differ.
PeerGrade/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateAssignment.jsx
│   │   │   ├── StudentAssignments.jsx
│   │   │   ├── PeerReview.jsx
│   │   │   ├── CalibrationDashboard.jsx
│   │   │   ├── InstructorGrades.jsx
│   │   │   ├── StudentResults.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── backend/
    ├── services/
    │   └── reviewAllocationService.js
    ├── models/
    ├── controllers/
    ├── routes/
    ├── server.js
    ├── .env
    └── package.json
Prerequisites
Install the following before running the application:
- Node.js and npm
- MongoDB Community Server running locally, or a MongoDB connection string
- A modern web browser
Installation
1. Configure the backend
Open a terminal in the backend directory:
npm install
Create a .env file in backend/:
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/peergrade
JWT_SECRET=replace_with_a_long_random_secret
Replace the JWT secret with a long, random value. Do not commit real secrets or production credentials to version control.

Start the backend using the script defined in backend/package.json. Common examples are:
npm run dev
or:
npm start
Use whichever script is present in your project.
2. Configure the frontend
Open a second terminal in the frontend directory:
npm install
The frontend API client should point to the backend. In the current setup, frontend/src/services/api.js uses:
baseURL: "http://localhost:5000/api"
Start the frontend:
npm run dev
Open the local URL printed by Vite in the terminal (commonly http://localhost:5173).
3. Verify the backend
With the backend running, open this health endpoint in your browser:
http://localhost:5000/api/health
A healthy server should respond with a status similar to:
{
  "status": "healthy"
}
Application Workflow
Instructor
1. Sign in with an instructor account.
2. Create and publish an assignment with its rubric and maximum marks.
3. Review the assignment list on the dashboard.
4. Allocate blind peer reviews using Allocate Peer Reviews.
5. Open Calibration Dashboard to inspect review activity and scoring patterns.
6. After the required peer reviews are submitted, open Grade Management.
7. Click Calculate Draft Grades.
8. Review each student's calculated marks and add instructor feedback.
9. Save feedback and click Release Grade when ready.
Student
1. Sign in with a student account.
2. Open the assignments page and submit work.
3. Open Peer Reviews and complete the assigned reviews.
4. Open Results to view grades after the instructor releases them.
Administrator
1. Sign in with an administrator account.
2. Open the admin dashboard to view and manage users, subject to the permissions implemented in the application.
Peer-Review Allocation Notes
- A student should not be assigned to review their own submission.
- The current allocation service requires at least 3 submissions for an assignment.
- The allocation logic aims to assign 2 reviews per submission.
- Re-running allocation should avoid duplicating existing assignment/submission/reviewer pairs.
- Allocation can report zero newly allocated reviews when all required review assignments already exist.
The review count and allocation behavior should be verified against the actual data and model constraints in your local project.
Grade Calculation Notes
- Grade calculation uses completed peer reviews.
- Each submission needs at least 2 completed peer reviews before a draft grade can be calculated or released, according to the current project logic.
- Draft grades should be checked by the instructor before release.
- Students should only see grades whose status is RELEASED.
Troubleshooting
Backend does not start
- Check that MongoDB is running.
- Confirm MONGO_URI, PORT, and JWT_SECRET are configured.
- Check whether another process is already using port 5000.
- Read the first relevant error in the backend terminal.
Frontend cannot connect to the backend
- Confirm the backend health endpoint responds.
- Check the API base URL in frontend/src/services/api.js.
- Check browser developer tools for network errors and backend messages.
- Ensure the backend CORS configuration allows the frontend origin.
No reviews are allocated
- Confirm at least three students have submitted the selected assignment.
- Confirm the assignment ID selected by the UI belongs to the correct assignment.
- Check the backend terminal for allocation errors.
Draft grades are missing
- Confirm the assigned reviews have been submitted, not just allocated.
- Confirm every submission has at least two completed peer reviews.
- Check the response and error message from the grade calculation endpoint.
Grade Management page does not open
- Confirm frontend/src/pages/InstructorGrades.jsx exists.
- Confirm App.jsx imports InstructorGrades and defines the /instructor/grades route.
- Confirm the dashboard button navigates to /instructor/grades?assignmentId=....
Student cannot see a grade
- Confirm the instructor released the grade.
- Confirm the student is signed in to the correct account.
- Confirm the student results page calls the appropriate grades endpoint.
Testing Checklist
- [ ] Backend starts and connects to MongoDB.
- [ ] Health endpoint reports a healthy status.
- [ ] Users can register and sign in.
- [ ] Instructor can create and publish an assignment.
- [ ] Students can submit assignments.
- [ ] Instructor can allocate peer reviews.
- [ ] Students see only their assigned reviews and cannot review their own work.
- [ ] Students can submit rubric scores and feedback.
- [ ] Calibration dashboard displays review data.
- [ ] Instructor can calculate draft grades after the review requirements are met.
- [ ] Instructor can save feedback and release grades.
- [ ] Students can view their own released grades.
- [ ] Admin functions work according to assigned permissions.
Security Notes
- Keep .env files and secrets out of source control.
- Use backend authorization checks in addition to frontend route protection.
- Verify instructor ownership of assignments before allocation, grade calculation, feedback updates, and grade release.
- Ensure blind review responses do not expose the submission author's identity.
- Validate rubric criteria and marks on the backend; frontend validation alone is not sufficient.
Development Status
PeerGrade has been developed incrementally. The local workflow has been reported to support backend health checks, assignment creation/listing, student submission, and peer-review allocation/display. Other features should be confirmed using the testing checklist before describing the application as production-ready.
