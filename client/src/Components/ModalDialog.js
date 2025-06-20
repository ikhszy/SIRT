// client/src/components/ModalDialog.js
import React from 'react';

const ModalDialog = ({ show, title, message, onClose, isSuccess = true }) => {
  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog">
        <div className={`modal-content border-${isSuccess ? 'success' : 'danger'}`}>
          <div className={`modal-header bg-${isSuccess ? 'success' : 'danger'} text-white`}>
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-secondary">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDialog;