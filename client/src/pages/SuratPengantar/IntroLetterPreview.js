// client/src/pages/SuratPengantar/IntroLetterPreview.js
import React from 'react';
import './IntroLetterPreview.css'; // for print styles

const formatDate = (str) => {
  const date = new Date(str);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

export default function IntroLetterPreview({ resident, letterNumber, letterPurpose, settings, date_created }) {
  const today = formatDate(date_created || new Date());

  return (
    <div className="letter-container">
      <div className="letter-header">
        <img src="/logo_dki.png" alt="Logo DKI" className="letter-logo" />
        <div className="letter-heading-text">
          <h4 className="mb-0">
            <strong>RUKUN TETANGGA {settings.rt} RUKUN WARGA {settings.rw}</strong>
          </h4>
          <div>KELURAHAN {settings.kelurahan.toUpperCase()}, KECAMATAN {settings.kecamatan.toUpperCase()}</div>
          <div>KOTA {settings.kota.toUpperCase()}</div>
        </div>
      </div>
      <hr />
      <h5 className="mt-3 mb-1 text-center"><u>SURAT PENGANTAR</u></h5>
      <div className="text-center">Nomor: {letterNumber}</div>

      <div className="mt-3">
        <p>
          Yang bertanda tangan di bawah ini, Pengurus Rukun Tetangga {settings.rt} / {settings.rw}, Kelurahan {settings.kelurahan}, Kecamatan {settings.kecamatan}, Kota {settings.kota}, dengan ini menerangkan bahwa:
        </p>

        <table className="table-no-border">
          <tbody>
            <tr><td>Nama</td><td>: {resident.full_name}</td></tr>
            <tr><td>Tempat/Tanggal Lahir</td><td>: {resident.birthplace}, {formatDate(resident.birthdate)}</td></tr>
            <tr><td>Jenis Kelamin</td><td>: {resident.gender}</td></tr>
            <tr><td>NIK / KK</td><td>: {resident.nik} / {resident.kk_number}</td></tr>
            <tr><td>Status</td><td>: {resident.marital_status}</td></tr>
            <tr><td>Pekerjaan</td><td>: {resident.occupation}</td></tr>
            <tr><td>Kewarganegaraan</td><td>: {resident.citizenship}</td></tr>
            <tr><td>Pendidikan</td><td>: {resident.education}</td></tr>
            <tr><td>Agama</td><td>: {resident.religion}</td></tr>
            <tr><td>Alamat</td><td>: {resident.full_address}, RT {settings.rt}/RW {settings.rw}, {settings.kelurahan}, {settings.kecamatan}, {settings.kota}</td></tr>
          </tbody>
        </table>

        <div className='mt-5 row'>
          <p><strong>Maksud/Keperluan</strong>:</p>
          <p>{letterPurpose}</p>
        </div>

        <div className="mt-5 row">
          <div className="col-6">
            <p>(Diisi oleh RW)</p>
            <table className="table-no-border">
              <tbody>
                <tr><td>Nomor</td><td>:</td></tr>
                <tr><td>Tanggal</td><td>:</td></tr>
              </tbody>
            </table>
          </div>
          <div className="col-6 text-center">
            <p>{settings.kota}, {today}</p>
          </div>
        </div>

        <div className="row mt-1">
          <div className="col-6 text-center">
            Mengetahui,<br />
            PENGURUS RUKUN WARGA {settings.rw}<br />
            KELURAHAN {settings.kelurahan.toUpperCase()}
            <br /><br /><br /><br />
            <strong>............................................</strong>
          </div>
          <div className="col-6 text-center">
            <br />
            PENGURUS RUKUN TETANGGA {settings.rt}<br />
            KELURAHAN {settings.kelurahan.toUpperCase()}
            <br /><br /><br /><br />
            <strong>............................................</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
