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
    const age = now.getFullYear() - birthDate.getFullYear();

    if (age <= 12) ageGroups.anak++;
    else if (age <= 17) ageGroups.remaja++;
    else if (age <= 59) ageGroups.dewasa++;
    else ageGroups.lansia++;
  });

  return ageGroups;
}
