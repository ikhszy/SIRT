import { useEffect, useState } from "react";
import api from "../api";

export default function ResidentList() {
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    api.get("/residents").then((res) => {
      setResidents(res.data);
    });
  }, []);

  return (
    <div>
      <h2>Residents</h2>
      <table border="1" cellPadding="6" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Name</th><th>NIK</th><th>Gender</th><th>Age</th><th>Household</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.nik}</td>
              <td>{r.gender}</td>
              <td>{r.age}</td>
              <td>{r.family_card_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
