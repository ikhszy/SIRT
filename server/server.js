// server/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

const authMiddleware = require('./middleware/authMiddleware');

const dashboardRoutes = require("./routes/dashboard");
const residentsRoutes = require("./routes/residents");
const householdsRoutes = require("./routes/households");
const residentDetailsRoutes = require("./routes/residentDetails");
const addressRoutes = require("./routes/addressRoutes");
const authRoutes = require('./routes/auth');
const addressImportRouter = require("./routes/bulkAddresses");
const householdsImportRouter = require('./routes/bulkHouseholds');
const bulkResidentsRouter = require("./routes/bulkResidents");
const financeRoutes = require('./routes/finance');
const settingsRoutes = require('./routes/settingsRoutes');
const usersRoutes = require('./routes/usersRoutes');
const introLettersRoutes = require('./routes/introLettersRoutes');

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes); // login doesn't need auth

// Apply authMiddleware to everything below (protected routes)
app.use(authMiddleware);

app.use('/api/dashboard', dashboardRoutes);
app.use("/api/residents", residentsRoutes);
app.use("/api/households", householdsRoutes);
app.use("/api/resident-details", residentDetailsRoutes);
app.use("/api/address", addressRoutes);
app.use("/uploads", express.static('uploads'));
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use("/api/address-import", addressImportRouter);
app.use("/api/households-import", householdsImportRouter);
app.use("/api/residents-import", bulkResidentsRouter);
app.use("/api/finance", financeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", usersRoutes);
app.use('/api/surat', introLettersRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
