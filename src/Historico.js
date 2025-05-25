import React from 'react';

function Historico({ registros, onClose }) {
  return (
    <div className="historico-container">
      <h2>Histórico de Registros</h2>
      {registros.length === 0 ? (
        <p>Nenhum registro encontrado.</p>
      ) : (
        <ul className="historico-lista">
          {registros.map((registro, index) => (
            <li key={index} className="historico-item">
              {new Date(registro.dataHora || registro.data).toLocaleDateString()} -
              {new Date(registro.dataHora || registro.data).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} :
              <strong> {registro.calorias} cal</strong>
            </li>
          ))}
        </ul>
      )}
      <button className="btn-fechar-historico" onClick={onClose}>Fechar Histórico</button>
    </div>
  );
}

export default Historico;