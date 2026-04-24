import React from 'react';
import './InputField.css';

const InputField = ({ label, id, name, type = 'text', placeholder, value, onChange, icon, error }) => {
  return (
    <div className="input-group">
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`custom-input ${error ? 'error-input' : ''}`}
        />
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default InputField;
