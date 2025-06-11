const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/community.sqlite");
const db = new sqlite3.Database(dbPath);

const faker = require("@faker-js/faker").faker; // requires: npm install @faker-js/faker

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widower'];
const relationships = ['Husband', 'Wife', 'Children'];
const occupations = ['PNS', 'Guru', 'Petani', 'Pedagang', 'Pelajar', 'Mahasiswa', 'Buruh', 'Wiraswasta'];

const createAddresses = () => {
  const stmt = db.prepare("INSERT INTO address (full_address, rt, rw, village, district, city, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (let i = 1; i <= 17; i++) {
    stmt.run(
      `R1 no. ${i}`,
      faker.string.numeric(2),
      faker.string.numeric(2),
      faker.location.city(),
      faker.location.county(),
      faker.location.city(),
      faker.string.numeric(5)
    );
  }
  stmt.finalize();
};

const createHouseholds = () => {
  const stmt = db.prepare("INSERT INTO households (kk_number, status, address_id) VALUES (?, ?, ?)");
  for (let i = 1; i <= 20; i++) {
    const kk = "KK" + faker.string.numeric(8);
    const addressId = (i % 17) + 1;
    const status = i % 5 === 0 ? 'Asing' : 'Lokal';
    stmt.run(kk, status, addressId);
  }
  stmt.finalize();
};

const createResidents = () => {
  db.all("SELECT kk_number, address_id FROM households", (err, households) => {
    if (err) throw err;

    const stmt = db.prepare(`INSERT INTO residents (
      full_name, nik, gender, birthplace, birthdate, blood_type, age,
      religion, marital_status, relationship, education, occupation,
      citizenship, address_id, kk_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (let i = 0; i < 50; i++) {
      const h = households[i % households.length];
      const birthDate = faker.date.birthdate({ min: 1, max: 70, mode: 'age' });
      const age = new Date().getFullYear() - birthDate.getFullYear();
      stmt.run(
        faker.person.fullName(),
        faker.string.numeric(16),
        faker.person.sex() === "male" ? "Laki-laki" : "Perempuan",
        faker.location.city(),
        birthDate.toISOString().split("T")[0],
        faker.helpers.arrayElement(bloodTypes),
        age,
        faker.helpers.arrayElement(["Islam", "Kristen", "Katolik", "Hindu", "Buddha"]),
        faker.helpers.arrayElement(maritalStatuses),
        faker.helpers.arrayElement(relationships),
        faker.helpers.arrayElement(["SMA", "SMP", "SD", "S1", "S2"]),
        faker.helpers.arrayElement(occupations),
        faker.location.country(),
        h.address_id,
        h.kk_number
      );
    }

    stmt.finalize();
    console.log("Sample data inserted.");
    db.close();
  });
};

// 🛠 RUN THE SCRIPT
createAddresses();
createHouseholds();
setTimeout(createResidents, 1000);