Here's a clear step-by-step explanation of how to work with your project setup:

---

### **Step 1: Start JSON Server**
1. Open a terminal window
2. Navigate to your JSON Server folder:
   ```bash
   cd path/to/doctor-server
   ```
3. Start JSON Server:
   ```bash
   npm run start
   ```
4. You should see:
   ```
   \{^_^}/ hi!

   Loading db.json
   Done

   Resources
   http://localhost:4000/doctors
   http://localhost:4000/appointments

   Home
   http://localhost:4000
   ```

---

### **Step 2: Start Next.js Application**
1. Open a **new terminal window** (keep JSON Server running)
2. Navigate to your Next.js project folder:
   ```bash
   cd path/to/your-nextjs-app
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. You should see:
   ```
   ready - started server on 0.0.0.0:3000
   ```

---

### **Step 3: Verify Both Servers Are Running**
| Service        | URL                  | Port  | Terminal Window |
|----------------|----------------------|-------|-----------------|
| JSON Server    | http://localhost:4000 | 4000  | First terminal  |
| Next.js App    | http://localhost:3000 | 3000  | Second terminal |

---

### **Step 4: Check Database Content**
To view/modify data directly in your JSON database:

1. **View All Appointments**:
   ```
   http://localhost:4000/appointments
   ```

2. **View All Doctors**:
   ```
   http://localhost:4000/doctors
   ```

3. **View Specific Appointment**:
   ```
   http://localhost:4000/appointments/1  # Replace 1 with appointment ID
   ```

4. **Raw Database File**:
   Open `doctor-server/db.json` in your code editor to see all stored data

---

### **Step 5: Perform CRUD Operations**
While using your Next.js app, you can verify operations through:

1. **Create (POST)**:
   - New entries will appear in `db.json`
   - Check `http://localhost:4000/appointments`

2. **Read (GET)**:
   - All data is visible at the URLs above

---

### **Important Notes**
1. **Keep Both Servers Running**:
   - The Next.js app needs the JSON Server to handle API requests
   - Closing either terminal will stop that service

2. **Database Persistence**:
   - All changes are saved in `doctor-server/db.json`
   - This file acts as your mock database

3. **Troubleshooting**:
   - If changes don't appear, refresh the JSON Server endpoints
   - Ensure there are no port conflicts (4000/3000)
   - Verify `db.json` has proper read/write permissions

---

### **Summary Flow**
1. Develop using Next.js at `http://localhost:3000`
2. All data operations go through `http://localhost:4000`
3. Verify stored data in:
   - JSON Server endpoints
   - Physical `db.json` file
   - Your application's UI

This setup allows you to work with a full-stack application locally while maintaining a persistent mock database through JSON Server!
