import React, { useState, useEffect } from 'react';
import './App.css';
import Historico from './Historico';
import { GoogleLogin } from '@react-oauth/google';

function App() {
  const [totalCalorias, setTotalCalorias] = useState(0);
  const [historicoVisivel, setHistoricoVisivel] = useState(false);
  const [registrosHistorico, setRegistrosHistorico] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [ultimoLancamentos, setUltimoLancamentos] = useState([]);
  const [dataHoraRegistro, setDataHoraRegistro] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [fusoHorarioUsuario, setFusoHorarioUsuario] = useState('');
  const [exibirUltimos7Dias, setExibirUltimos7Dias] = useState(false);
  const [filtroLancamentos, setFiltroLancamentos] = useState('7');
  const [saldoPeriodo, setSaldoPeriodo] = useState([]);

  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFusoHorarioUsuario(timeZone);
      console.log("Fuso horário do usuário detectado:", timeZone);
    } catch (error) {
      console.error("Não foi possível detectar o fuso horário do usuário:", error);
      setFusoHorarioUsuario('Não detectado');
    }
  }, []);

  useEffect(() => {
    if (usuarioLogado?.sub) {
      // Aqui, em vez de carregar dados de exemplo,
      // você buscaria os dados reais do usuário (se já tivesse a lógica implementada).
      // Por enquanto, vamos inicializar com arrays vazios.
      setUltimoLancamentos([]);
      setRegistrosHistorico([]);
    } else {
      setUltimoLancamentos([]);
      setRegistrosHistorico([]);
    }
  }, [usuarioLogado]);

  useEffect(() => {
    if (exibirUltimos7Dias) {
      atualizarSaldoPeriodo(filtroLancamentos);
    }
  }, [exibirUltimos7Dias, ultimoLancamentos, filtroLancamentos]);

  const adicionarCaloria = () => {
    setTotalCalorias(prevCalorias => prevCalorias + 100);
  };

  const subtrairCaloria = () => {
    setTotalCalorias(prevCalorias => prevCalorias - 100);
  };

  const enviarRegistro = () => {
    if (usuarioLogado?.sub) {
      const novoRegistro = {
        id: Date.now().toString(),
        usuarioId: usuarioLogado.sub,
        calorias: totalCalorias,
        dataHora: dataHoraRegistro,
      };
      console.log('Registro a ser enviado (simulação) com data:', novoRegistro);
      alert(`Registro enviado por ${usuarioLogado.name}: ${totalCalorias} calorias em ${new Date(novoRegistro.dataHora).toLocaleString()}`);

      setUltimoLancamentos(prevLancamentos => [novoRegistro, ...prevLancamentos]);
      setRegistrosHistorico(prevRegistros => [novoRegistro, ...prevRegistros]);

      setTotalCalorias(0);
      setDataHoraRegistro(() => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      });
    } else {
      alert('Por favor, faça login para registrar as calorias.');
    }
  };

  const mostrarHistorico = () => {
    setHistoricoVisivel(true);
  };

  const esconderHistorico = () => {
    setHistoricoVisivel(false);
  };

  const onSuccess = (credentialResponse) => {
    try {
      const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      setUsuarioLogado(decoded);
      alert(`Login bem-sucedido, bem-vindo(a) ${decoded.name}!`);
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      alert('Erro ao processar o login. Tente novamente.');
    }
  };

  const onError = () => {
    console.log('Login Failed');
    alert('Falha ao fazer login com o Google. Tente novamente.');
  };

  const handleDataHoraChange = (event) => {
    setDataHoraRegistro(event.target.value);
  };

  const handleDeleteLancamento = (idToDelete) => {
    setUltimoLancamentos(prevLancamentos => prevLancamentos.filter(lancamento => lancamento.id !== idToDelete));
    setRegistrosHistorico(prevRegistros => prevRegistros.filter(registro => registro.id !== idToDelete));
    alert('Lançamento excluído (simulado)!');
  };

  const hoje = new Date();

  const ultimoLancamentosDoDia = ultimoLancamentos.filter(lancamento => {
    const dataLancamento = new Date(lancamento.dataHora);
    return (
      dataLancamento.getDate() === hoje.getDate() &&
      dataLancamento.getMonth() === hoje.getMonth() &&
      dataLancamento.getFullYear() === hoje.getFullYear()
    );
  }).sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  const filtrarLancamentosUltimosNDias = (dias) => {
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - dias);
    return ultimoLancamentos.filter(lancamento => {
      const dataLancamento = new Date(lancamento.dataHora);
      return dataLancamento >= dataLimite;
    }).sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
  };

  const toggleExibirUltimos7Dias = () => {
    setExibirUltimos7Dias(!exibirUltimos7Dias);
    setFiltroLancamentos('7'); // Reseta o filtro ao abrir
  };

  const aplicarFiltro = (dias) => {
    setFiltroLancamentos(dias);
    atualizarSaldoPeriodo(dias);
  };

  const atualizarSaldoPeriodo = (dias) => {
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - parseInt(dias));
    const lancamentosFiltrados = ultimoLancamentos.filter(lancamento => {
      const dataLancamento = new Date(lancamento.dataHora);
      return dataLancamento >= dataLimite;
    });

    const saldoPorDiaCalculado = [];
    const dataAtual = new Date();
    for (let i = 0; i < parseInt(dias); i++) {
      const dataComparacao = new Date(dataAtual);
      const lancamentosDoDia = lancamentosFiltrados.filter(lancamento => {
        const dataLancamento = new Date(lancamento.dataHora);
        return (
          dataLancamento.getDate() === dataComparacao.getDate() &&
          dataLancamento.getMonth() === dataComparacao.getMonth() &&
          dataLancamento.getFullYear() === dataComparacao.getFullYear()
        );
      });
      const saldo = lancamentosDoDia.reduce((acc, lancamento) => acc + lancamento.calorias, 0);
      const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(dataComparacao);
      const dataFormatada = `${dataComparacao.getDate().toString().padStart(2, '0')}/${(dataComparacao.getMonth() + 1).toString().padStart(2, '0')}/${dataComparacao.getFullYear().toString().slice(-2)}`;
      saldoPorDiaCalculado.push({ data: new Date(dataComparacao), diaSemana, dataFormatada, saldo });
      dataAtual.setDate(dataAtual.getDate() - 1);
    }
    setSaldoPeriodo(saldoPorDiaCalculado.sort((a, b) => b.data - a.data));
  };

  const ultimoLancamentosFiltrados = exibirUltimos7Dias ? filtrarLancamentosUltimosNDias(filtroLancamentos === 'all' ? Infinity : parseInt(filtroLancamentos)) : ultimoLancamentosDoDia;

  return (
    <div className="App">
      {usuarioLogado && (
        <div className="usuario-logado">
          <p>Logado como: <strong>{usuarioLogado.name}</strong></p>
          <p className="fuso-horario">Fuso horário: {fusoHorarioUsuario}</p>
        </div>
      )}

      <h1>Contador de Calorias</h1>

      {!usuarioLogado ? (
        <div className="login-container">
          <p>Faça login para salvar suas calorias:</p>
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            cookiePolicy={'single_host_origin'}
          />
        </div>
      ) : (
        <>
          <div className="top-controls">
            <div className="contador-principal">
              <button className="btn-contador" onClick={subtrairCaloria}>-</button>
              <input
                type="text"
                value={totalCalorias}
                readOnly
                className="input-calorias"
                onClick={mostrarHistorico}
              />
              <button className="btn-contador" onClick={adicionarCaloria}>+</button>
            </div>

            <div className="registro-data-hora">
              <input
                type="datetime-local"
                value={dataHoraRegistro}
                onChange={handleDataHoraChange}
                className="input-data-hora"
              />
              <button className="btn-enviar" onClick={enviarRegistro}>= Enviar</button>
            </div>
          </div>

          <div className="lancamentos-info">
            <h2>Últimos Lançamentos</h2>
            {!exibirUltimos7Dias && (
              <>
                {ultimoLancamentosDoDia.length === 0 ? (
                  <p>Nenhum lançamento hoje.</p>
                ) : (
                  <div className="lista-lancamentos">
                    {ultimoLancamentosDoDia.map((lancamento) => (
                      <p key={lancamento.id} className="lancamento-item">
                        {new Date(lancamento.dataHora).toLocaleDateString()} -
                        {new Date(lancamento.dataHora).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} :
                        <strong> {lancamento.calorias} cal</strong>
                        <button
                          className="btn-excluir-lancamento"
                          onClick={() => handleDeleteLancamento(lancamento.id)}
                        >
                          Excluir
                        </button>
                      </p>
                    ))}
                  </div>
                )}
                {ultimoLancamentos.length > ultimoLancamentosDoDia.length && (
                  <div className="ver-mais-button">
                    <button onClick={toggleExibirUltimos7Dias}>Ver Últimos 7 Dias</button>
                  </div>
                )}
              </>
            )}

            {exibirUltimos7Dias && (
              <div className="modal-ultimos-7-dias">
                <h2>Lançamentos</h2>
                <div className="filtros-7-dias">
                  <button onClick={() => aplicarFiltro('7')} className={filtroLancamentos === '7' ? 'active' : ''}>Últimos 7 dias</button>
                  <button onClick={() => aplicarFiltro('30')} className={filtroLancamentos === '30' ? 'active' : ''}>Últimos 30 dias</button>
                  <button onClick={() => aplicarFiltro('365')} className={filtroLancamentos === '365' ? 'active' : ''}>Último ano</button>
                  <button onClick={toggleExibirUltimos7Dias}>Ocultar</button>
                </div>
                <div className="lista-lancamentos">
                  {ultimoLancamentosFiltrados.length === 0 ? (
                    <p>Nenhum lançamento neste período.</p>
                  ) : (
                    ultimoLancamentosFiltrados.map((lancamento) => (
                      <p key={lancamento.id} className="lancamento-item">
                        {new Date(lancamento.dataHora).toLocaleDateString()} -
                        {new Date(lancamento.dataHora).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} :
                        <strong> {lancamento.calorias} cal</strong>
                        <button
                          className="btn-excluir-lancamento"
                          onClick={() => handleDeleteLancamento(lancamento.id)}
                        >
                          Excluir
                        </button>
                      </p>
                    ))
                  )}
                </div>
                <div className="saldo-periodo">
                  <h3>Saldo por dia</h3>
                  <ul>
                    {saldoPeriodo.map(item => (
                      <li key={item.data.toISOString()}>
                        {item.diaSemana} {item.dataFormatada}: <strong>{item.saldo} cal</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {historicoVisivel && (
        <Historico
          registros={registrosHistorico}
          onClose={esconderHistorico}
        />
      )}
    </div>
  );
}

export default App;