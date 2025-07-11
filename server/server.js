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
const inventoryRoutes = require('./routes/inventoryRoutes');
const inventoryTransactionsRoutes = require('./routes/inventoryTransactionsRoutes');
const donationRoutes = require('./routes/donationRoutes');

app.use(cors());
app.use(express.json());

// unprotected routes
app.use('/api', authRoutes); // login doesn't need auth
app.use("/uploads", express.static('uploads'));
app.use("/public", express.static(path.join(__dirname, 'public')));

// Apply authMiddleware to everything below (protected routes)
app.use(authMiddleware);

// protected API routes
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/residents", residentsRoutes);
app.use("/api/households", householdsRoutes);
app.use("/api/resident-details", residentDetailsRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/address-import", addressImportRouter);
app.use("/api/households-import", householdsImportRouter);
app.use("/api/residents-import", bulkResidentsRouter);
app.use("/api/finance", financeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", usersRoutes);
app.use('/api/surat', introLettersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory-transactions', inventoryTransactionsRoutes);
app.use('/api/donations', donationRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
