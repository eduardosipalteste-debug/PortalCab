
// Brand Colors
export const sipalBlue = '#012169';
export const sipalTeal = '#008479';

// Form Steps
export const steps = [
    "Informações Gerais", "Plano de Implantação", "Mapa de Transporte", "Caderno de Testes", 
    "Plano de Retorno", "Plano de Comunicação", "Risco de Mudança", "Segurança e Acessos", 
    "Contatos", "Checklist", "Checklist SAP", "Anexos e Envio", "Análise e Finalização"
];

export const WIZARD_STORAGE_KEY = 'cab-form-in-progress';
export const USER_SESSION_KEY = 'cab-user-session';
export const REMEMBER_ME_KEY = 'cab-remember-credentials';

export const empresasSipal = [
    "FERTITEX",
    "INGA",
    "JUMASA",
    "Magparaná",
    "PORTO CENTRO SUL",
    "SIPAL AGRO"
];

export const etapasMudanca = [
    "Pré Implantação",
    "Implantação",
    "Pós Implantação",
    "Retorno (Rollback)"
];

export const checklistItems = [
    { scope: 'Análise de Impacto', question: 'Foi realizada uma análise de impacto detalhada, incluindo impacto em outros sistemas e serviços?' },
    { scope: 'Testes e Validação', question: 'A mudança foi testada em ambiente de homologação com dados representativos da produção?' },
    { scope: 'Testes e Validação', question: 'Existe um plano para validar os critérios de sucesso após a implantação?' },
    { scope: 'Acessos e Segurança', question: 'Os acessos aos ambiente de Homologação e Produção foram liberados para a equipe de implementação da mudança?' },
    { scope: 'Monitoramento', question: 'O plano de monitoramento foi testado em ambiente de homologação?' },
    { scope: 'Documentação', question: 'O desenho macro da arquitetura (linguagem utilizada, banco de dados, integrações, etc.) foi divulgado para a equipe do CAB?' },
    { scope: 'Documentação', question: 'O plano contempla como o time identifica os itens publicados em produção?' }
];

export const checklistSAPItems = [
    { id: 'SAP01', scope: 'Governança', question: 'O request foi devidamente classificado (Workbench, Customizing, Transport of Copies, Nota SAP/Support Package) e está documentado no Plano de Mudança?' },
    { id: 'SAP02', scope: 'Governança', question: 'O request foi testado em ambiente de homologação com dados representativos da produção antes do transporte?' },
    { id: 'SAP03', scope: 'Governança', question: 'O plano de rollback contempla reimportação de requests anteriores ou restauração de backup validado em ambiente de QA?' },
    { id: 'SAP04', scope: 'Governança', question: 'O tempo estimado de rollback foi validado em ambiente controlado e documentado no Plano de Mudança?' },
    { id: 'SAP05', scope: 'Arquitetura', question: 'Os objetos transportados foram comparados com o catálogo de objetos do ambiente produtivo para evitar sobrescrita indevida?' },
    { id: 'SAP06', scope: 'Arquitetura', question: 'Existe validação formal de que o request não contém objetos não relacionados à mudança (ex.: código não autorizado)?' },
    { id: 'SAP07', scope: 'Segurança', question: 'A segregação de funções foi respeitada (desenvolvedor != aprovador != importador de requests)?' },
    { id: 'SAP08', scope: 'Segurança', question: 'Existe controle de dual control para importação em Produção (ex.: aprovação via STMS_QA antes de liberação final)?' },
    { id: 'SAP09', scope: 'Segurança', question: 'Foi realizada validação de segurança SAP nos requests (checagem de objetos relacionados a perfis/autorização)?' },
    { id: 'SAP10', scope: 'Performance', question: 'Os requests foram revisados quanto a impactos de performance (queries, jobs ou dumps ABAP potenciais)?' },
    { id: 'SAP11', scope: 'Governança', question: 'Houve validação de que não existem transportes pendentes em Produção que possam gerar conflitos com o novo request?' },
    { id: 'SAP12', scope: 'Governança', question: 'Existe transportes em aberto relacionadas ao mesmo objetivo de transporte para as requests a serem transportadas?' }
];

export const servicosData = {
  'Requisições': [
    "Configurações de visualização", "Acesso Sites", "Acesso VPN", "Alteração de workflow",
    "Banco de dados", "E-mail", "Empréstimo de Equipamentos", "Impressora", "Instalação de Software",
    "Manutenção preventiva", "Mudança de Layout", "Novo acesso de usuário", "Novos Equipamentos",
    "Pasta de rede", "Reset de senha", "SAE - Solicitação de acesso e equipamentos (Novos colaboradores)",
    "Software"
  ],
  'Serviços': ["SAP"],
  'Incidentes / Falhas': [
    "Celulares", "Desktop", "Falha de acesso a sistema", "Impressora", "Internet", "Notebooks",
    "Periféricos", "Rede", "Segurança da Informação", "Servidores", "Sistemas", "Telecomunicação", "SAP"
  ],
  'Melhorias': ["Nova funcionalidade / Melhoria"]
};

export const sistemasAfetadosData = {
    'Sistema': [
      "ABACUS", "ADP", "Agrotis", "API Pass", "Apollo (desabilitado)", "Active Directory",
      "Agroboard", "Ariba", "Atua", "Central de Cadastros 4MDG", "BI", "Banco de dados",
      "CPJ", "Campos Dealer", "Campus Dealer", "CLICQ", "Chat Seguro", "CloudFlare",
      "Cotações ARIBA", "Crachá", "DFE", "DVR (Intelbras)", "Dynamo Peças / DPMax",
      "Dynamo Vendas / Dealer Prime", "E-mail", "Finnet", "Finet (desabilitado)",
      "Fleetboard", "GO Sistemas", "Google WorkSpace", "Guepardo", "Infra", "Jira",
      "Junsoft", "Legado COBOL", "Linx", "LocaWeb", "Maxicon", "Merx", "Next IP",
      "Outros", "PayTrack", "Portal AGCO", "Portal MBB", "QIVE", "Protheus", "ProDoc",
      "Pulsus", "RM", "RM Labore", "SAP", "SEFAZ", "Sênior", "SGI", "Salesforce",
      "Secullum", "Servidores", "Shapeness", "Sharepoint", "Simer", "Sistema Coletor",
      "Sistema Oficina/Posto", "Solution", "Strada", "T-Cloud", "TOTVs Monitor",
      "Teams", "Trizy", "UNIFI", "Umbler", "V2500", "Vendabem", "Via Nuvem", "WK",
      "Xentry", "Zeev"
    ]
  };

export const frentesSAPData = {
  'Frentes SAP': [
    "Integrações - CPI", "Manufatura-Tiroleza", "Logística - TM", "Originação - CM", "Originação - ACM",
    "Comercial - SD", "Controladoria - CO", "Suprimentos - MM", "Financeiro - TRM", "Ariba - MM",
    "Guepardo", "Financeiro -FI-AP/AR", "Maxicon", "Financeiro-FI-AA/GL", "Trizzy", "Agrotis",
    "Manufatura - QM", "Manufatura - PP", "Manufatura - PM", "Fiscal"
  ]
};

export interface Anexo {
    name: string;
    size: number;
    type: string;
}

export const contactTemplate = {
    nome: '',
    cargo: '',
    email: '',
    telefones: '',
    comunicacao: '',
    localAtuacao: '',
    liderImediato: '',
    emailLider: '',
    unidadeFilial: '',
    area: '',
    gestorArea: '',
    comunEnvolvida: ''
};

export const activityTemplate = {
    nomeAtividade: '',
    etapa: 'Pré Implantação',
    status: 'aberto',
    dataPlanejada: '',
    horaPlanejada: '',
    dataRealizada: '',
    horaRealizada: '',
    tipo: '',
    descricao: '',
    responsavel: '',
    departamento: '',
    itemConfiguracao: '',
    tempoExecucao: '',
    predecessora: '',
    observacao: ''
};

export const initialFormData = {
    informacoesGerais: {
        liderMudanca: '', solicitante: '', liderProduto: '', empresaAfetada: '', dataMudanca: '', dataAgendaCAB: '', motivoMudanca: '',
        impactoNaoRealizar: '', classificacao: 'Padrão', 
        motivoEmergencia: '', justificativaEmergencia: '', riscosEmergencia: '', tecnicaEmergencia: '',
        servicosAfetados: [] as string[],
        sistemasAfetados: [] as string[], indisponibilidade: 'Não', indisponibilidadeInicio: '', indisponibilidadeFim: '',
        restricoesMudanca: '',
        periodoMaximoInterrupcao: '', referenteSAP: 'Não',
        frentesSAP: [] as string[],
        aprovadoresEmergenciais: [] as any[],
        notificacoesEmergenciais: [] as any[],
    },
    checklist: checklistItems.map(item => ({ ...item, answer: '', docLink: '', justification: '' })),
    checklistSAP: checklistSAPItems.map(item => ({ ...item, answer: '', docLink: '', justification: '', observacao: '' })),
    planoImplantacao: [] as any[],
    mapaTransporte: [] as any[],
    planoRetorno: [] as any[],
    planoComunicacao: [] as any[],
    comunicacaoChecklist: {
        partesEnvolvidasValidaram: '',
        processoAcompanhamentoComunicado: '',
        comunicacaoEventoRetorno: '',
        passoAPassoAplicacao: '',
        tabelaContatosPreenchida: '',
        pontosFocaisInformados: '',
    },
    planoRiscos: [] as any[],
    riscosGerais: {
        planoRetornoClaro: '',
        stakeholdersConsultados: '',
    },
    cadernoTestes: [] as any[],
    segurancaAcessos: {
        perfis: [] as any[],
    },
    contatos: [] as any[],
    anexos: [] as Anexo[],
};

export const kanbanStatuses = {
    'Submitted': 'Aguardando Aprovação',
    'Approved': 'Aprovado',
    'Rejected': 'Rejeitado',
    'Pending Info': 'Pendente Informações',
    'In Progress': 'Em Execução',
    'Completed': 'Concluído',
    'Validation': 'Validação Final'
};
