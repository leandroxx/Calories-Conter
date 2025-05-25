import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import './App.css';
import Historico from './Historico';
import { GoogleLogin } from '@react-oauth/google';

// Importações do Firebase
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { db, collection, addDoc, getDocs, query, where, doc, deleteDoc } from './firebaseConfig'; // Importe a instância do app Firebase e funções do Firestore

function App() {
  // Estados da aplicação
  const [totalCalorias, setTotalCalorias] = useState(0);
  const [historicoVisivel, setHistoricoVisivel] = useState(false);
  const [registrosHistorico, setRegistrosHistorico] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [ultimoLancamentos, setUltimoLancamentos] = useState([]);
  const [dataHoraRegistro, setDataHoraRegistro] = useState(() => {
    const now = new Date();
    // Inicializa com a data e hora local do usuário, ajustando para o fuso horário
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [fusoHorarioUsuario, setFusoHorarioUsuario] = useState('');
  const [exibirUltimos7Dias, setExibirUltimos7Dias] = useState(false);
  const [filtroLancamentos, setFiltroLancamentos] = useState('7');
  const [saldoPeriodo, setSaldoPeriodo] = useState([]);

  // Instâncias do Firebase Auth
  const auth = getAuth(); // getAuth() sem 'app' se 'app' já foi inicializado globalmente em firebaseConfig
  const provider = new GoogleAuthProvider();

  // Efeito para detectar o fuso horário do usuário e observar o estado de autenticação do Firebase
  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFusoHorarioUsuario(timeZone);
      console.log("Fuso horário do usuário detectado:", timeZone);
    } catch (error) {
      console.error("Não foi possível detectar o fuso horário do usuário:", error);
      setFusoHorarioUsuario('Não detectado');
    }

    // Observador para verificar se o usuário está logado (Firebase)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário está logado
        setUsuarioLogado(user);
        console.log('Usuário autenticado (Firebase):', user);
        // Buscar dados do Firestore quando o usuário loga
        fetchLancamentos(user.uid);
      } else {
        // Usuário não está logado
        setUsuarioLogado(null);
        setUltimoLancamentos([]);
        setRegistrosHistorico([]);
        console.log('Usuário não autenticado.');
      }
    });

    return () => unsubscribe(); // Cleanup ao desmontar o componente
  }, [auth]); // Dependência 'auth' para garantir que o observador seja configurado corretamente

  // Função para buscar lançamentos do Firestore
  const fetchLancamentos = useCallback(async (userId) => {
    try {
      const q = query(collection(db, 'lancamentos'), where('usuarioId', '==', userId));
      const querySnapshot = await getDocs(q);
      const fetchedLancamentos = [];
      querySnapshot.forEach((doc) => {
        fetchedLancamentos.push({ id: doc.id, ...doc.data() });
      });
      // Ordena os lançamentos do mais recente para o mais antigo com base no timestamp
      fetchedLancamentos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setUltimoLancamentos(fetchedLancamentos);
      setRegistrosHistorico(fetchedLancamentos);
      console.log('Lançamentos carregados do Firestore:', fetchedLancamentos);
    } catch (error) {
      console.error('Erro ao buscar lançamentos do Firestore:', error);
      alert(`Erro ao carregar lançamentos: ${error.message}`);
    }
  }, [db]); // Adiciona 'db' como dependência

  // Função para adicionar calorias
  const adicionarCaloria = () => {
    setTotalCalorias(prevCalorias => prevCalorias + 100);
  };

  // Função para subtrair calorias
  const subtrairCaloria = () => {
    setTotalCalorias(prevCalorias => prevCalorias - 100);
  };

  // Função para enviar o registro de calorias para o Firestore
  const enviarRegistro = async () => {
    if (usuarioLogado?.uid) {
      try {
        const novoRegistro = {
          usuarioId: usuarioLogado.uid, // ID do usuário autenticado pelo Firebase
          calorias: totalCalorias,
          dataHora: dataHoraRegistro, // Data e hora selecionada pelo usuário (local)
          timestamp: new Date().toISOString() // Adiciona um timestamp ISO para facilitar a ordenação e filtragem precisa
        };

        // Adiciona um novo documento à coleção 'lancamentos' no Firestore
        const docRef = await addDoc(collection(db, 'lancamentos'), novoRegistro);
        console.log('Lançamento adicionado ao Firestore com ID:', docRef.id);
        alert(`Registro de ${totalCalorias} calorias em ${new Date(novoRegistro.dataHora).toLocaleString()} salvo!`);

        // Atualiza os estados locais para refletir o novo lançamento
        // Adicionamos o ID do documento retornado pelo Firestore para exclusão futura
        setUltimoLancamentos(prevLancamentos => [{ ...novoRegistro, id: docRef.id }, ...prevLancamentos]);
        setRegistrosHistorico(prevRegistros => [{ ...novoRegistro, id: docRef.id }, ...prevRegistros]);

        // Reseta o contador e a data/hora
        setTotalCalorias(0);
        setDataHoraRegistro(() => {
          const now = new Date();
          return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        });
      } catch (error) {
        console.error('Erro ao adicionar lançamento ao Firestore:', error);
        alert(`Erro ao salvar o lançamento: ${error.message}`);
      }
    } else {
      alert('Por favor, faça login para registrar as calorias.');
    }
  };

  // Função para mostrar o histórico (ainda não integrado com Firestore)
  const mostrarHistorico = () => {
    setHistoricoVisivel(true);
  };

  // Função para esconder o histórico
  const esconderHistorico = () => {
    setHistoricoVisivel(false);
  };

  // Callback de sucesso para o componente GoogleLogin
  const onSuccess = async (credentialResponse) => {
    try {
      // Cria uma credencial Google a partir da resposta do Google OAuth
      const credential = GoogleAuthProvider.credential(credentialResponse.credential);
      if (credential) {
        // Autentica o usuário com o Firebase usando a credencial Google
        const result = await signInWithPopup(auth, provider);
        // O observador 'onAuthStateChanged' (no useEffect) cuidará de atualizar o estado 'usuarioLogado'.
        alert(`Login com Google bem-sucedido, bem-vindo(a) ${result.user.displayName}!`);
        console.log('Usuário logado com Firebase:', result.user);
      } else {
        alert('Erro ao obter credenciais do Google.');
      }
    } catch (error) {
      console.error('Erro ao fazer login com o Google via Firebase:', error);
      alert(`Erro ao fazer login: ${error.message}`);
    }
  };

  // Callback de erro para o componente GoogleLogin
  const onError = () => {
    console.log('Login Failed');
    alert('Falha ao fazer login com o Google. Tente novamente.');
  };

  // Função para lidar com o logout do Firebase
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      // O observador 'onAuthStateChanged' cuidará de limpar o estado 'usuarioLogado'.
      alert('Logout realizado com sucesso.');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert(`Erro ao fazer logout: ${error.message}`);
    }
  };

  // Função para lidar com a mudança na data e hora do input
  const handleDataHoraChange = (event) => {
    setDataHoraRegistro(event.target.value);
  };

  // Função para deletar um lançamento do Firestore
  const handleDeleteLancamento = async (idToDelete) => {
    try {
      if (window.confirm('Tem certeza que deseja excluir este lançamento?')) { // Usando window.confirm para simplicidade, mas idealmente seria uma modal customizada
        await deleteDoc(doc(db, 'lancamentos', idToDelete));
        console.log('Lançamento excluído do Firestore com ID:', idToDelete);
        alert('Lançamento excluído!');

        // Atualiza os estados locais após a exclusão no Firestore
        setUltimoLancamentos(prevLancamentos => prevLancamentos.filter(lancamento => lancamento.id !== idToDelete));
        setRegistrosHistorico(prevRegistros => prevRegistros.filter(registro => registro.id !== idToDelete));
      }
    } catch (error) {
      console.error('Erro ao excluir lançamento do Firestore:', error);
      alert(`Erro ao excluir lançamento: ${error.message}`);
    }
  };

  // Obtém a data de hoje (local)
  const hoje = new Date();

  // Filtra lançamentos do dia atual (local)
  const ultimoLancamentosDoDia = ultimoLancamentos.filter(lancamento => {
    const dataLancamento = new Date(lancamento.dataHora);
    return (
      dataLancamento.getDate() === hoje.getDate() &&
      dataLancamento.getMonth() === hoje.getMonth() &&
      dataLancamento.getFullYear() === hoje.getFullYear()
    );
  }).sort((a, b) => new Date(b.timestamp || b.dataHora) - new Date(a.timestamp || a.dataHora)); // Ordena do mais recente para o mais antigo

  // Função para filtrar lançamentos dos últimos N dias
  const filtrarLancamentosUltimosNDias = (dias) => {
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - dias);
    return ultimoLancamentos.filter(lancamento => {
      const dataLancamento = new Date(lancamento.dataHora);
      return dataLancamento >= dataLimite;
    }).sort((a, b) => new Date(b.timestamp || b.dataHora) - new Date(a.timestamp || a.dataHora));
  };

  // Função para calcular e atualizar o saldo por dia para um período
  const atualizarSaldoPeriodo = useCallback((dias) => {
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - parseInt(dias));
    const lancamentosFiltrados = ultimoLancamentos.filter(lancamento => {
      const dataLancamento = new Date(lancamento.dataHora);
      return dataLancamento >= dataLimite;
    });

    const saldoPorDiaCalculado = [];
    const dataAtualIteracao = new Date(hoje); // Usar uma nova instância para iteração
    for (let i = 0; i < parseInt(dias); i++) {
      const dataComparacao = new Date(dataAtualIteracao);
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
      const dataFormatada = `<span class="math-inline">\{dataComparacao\.getDate\(\)\.toString\(\)\.padStart\(2, '0'\)\}/</span>{(dataComparacao.getMonth() + 1).toString().padStart(2, '0')}/${dataComparacao.getFullYear().toString().slice(-2)}`;
      saldoPorDiaCalculado.push({ data: new Date(dataComparacao), diaSemana, dataFormatada, saldo });
      dataAtualIteracao.setDate(dataAtualIteracao.getDate() - 1); // Decrementa o dia para a próxima iteração
    }
    setSaldoPeriodo(saldoPorDiaCalculado.sort((a, b) => b.data - a.data)); // Ordena do mais novo para o mais antigo
  }, [hoje, ultimoLancamentos]); // Adiciona 'hoje' e 'ultimoLancamentos' como dependências

  // Efeito para atualizar o saldo do período quando o filtro ou lançamentos mudam
  useEffect(() => {
    if (exibirUltimos7Dias && usuarioLogado?.uid) { // Só atualiza se estiver logado e a modal estiver visível
      atualizarSaldoPeriodo(filtroLancamentos);
    }
  }, [exibirUltimos7Dias, ultimoLancamentos, filtroLancamentos, usuarioLogado, atualizarSaldoPeriodo]); // 'atualizarSaldoPeriodo' adicionado aqui

  // Função para alternar a exibição da modal dos últimos 7 dias
  const toggleExibirUltimos7Dias = () => {
    setExibirUltimos7Dias(!exibirUltimos7Dias);
    setFiltroLancamentos('7'); // Reseta o filtro ao abrir
  };

  // Função para aplicar o filtro de dias na modal
  const aplicarFiltro = (dias) => {
    setFiltroLancamentos(dias);
    atualizarSaldoPeriodo(dias);
  };

  // Lançamentos a serem exibidos na modal (filtrados pelo período selecionado)
  const ultimoLancamentosFiltrados = exibirUltimos7Dias ? filtrarLancamentosUltimosNDias(filtroLancamentos === 'all' ? Infinity : parseInt(filtroLancamentos)) : ultimoLancamentosDoDia;

  return (
    <div className="App">
      {usuarioLogado && (
        <div className="usuario-logado">
          <p>Logado como: <strong>{usuarioLogado.displayName || 'Usuário'}</strong></p>
          <p className="fuso-horario">Fuso horário: {fusoHorarioUsuario}</p>
          <button onClick={handleLogout}>Logout</button>
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
                        {new Date(lancamento.dataHora).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} :
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
                {/* Botão para ver últimos 7 dias só