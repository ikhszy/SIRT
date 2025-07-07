export function groupResidentsByAge(residents) {
  const now = new Date();
  const ageGroups = {
    anak: 0,    // 0–12
    remaja: 0,  // 13–17
    dewasa: 0,  // 18–59
    lansia: 0   // 60+
  };

  residents.forEach((res) => {
    if (!res.birthdate) return;

    const birthDate = new Date(res.birthdate);
    let age = now.getFullYear() - birthDate.getFullYear();

    // Adjust if birthday hasn’t occurred yet this year
    const hasHadBirthdayThisYear =
      now.getMonth() > birthDate.getMonth() ||
      (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
    if (!hasHadBirthdayThisYear) {
      age--;
    }

    if (age >= 0 && age <= 12) ageGroups.anak++;
    else if (age >= 13 && age <= 17) ageGroups.remaja++;
    else if (age >= 18 && age <= 59) ageGroups.dewasa++;
    else if (age >= 60) ageGroups.lansia++;
  });

  return ageGroups;
}
