import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    initialFormData, steps, checklistItems, checklistItems as checklistItemsStandard, checklistSAPItems, WIZARD_STORAGE_KEY,
    servicosData, sistemasAfetadosData, frentesSAPData, activityTemplate, contactTemplate, empresasSipal, etapasMudanca, Anexo
} from '../../constants/app-constants';
import { generateAndUploadPdf, newId, generateTimeSlots } from '../../utils/app-utils';
import { 
    MultiSelect, WizardProgressBar, Tooltip, Modal
} from '../ui/AppUI';
import { 
    TrashIcon, ExpandIcon, CalendarIcon, CheckIcon, UploadIcon, AlertIcon, DownloadIcon, HelpIcon
} from '../icons/AppIcons';

const OCCUPIED_SLOTS_KEY = 'cab-occupied-slots';

const testTemplate = {
    nomeTeste: '',
    plano: 'Funcional',
    tipoTeste: 'TU - Teste Unitário',
    dataPlanejada: '',
    horaPlanejada: '',
    atividade: '',
    linkTeste: '',
    predecessora: '',
    responsavel: '',
    departamento: '',
    itemConfiguracao: '',
    tempoExecucao: ''
};

const communicationTemplate = {
    data: '',
    hora: '',
    status: '',
    meio: 'E-mail',
    atividadePublico: '',
    responsavel: '',
    contatoEscalonamento: '',
    observacao: ''
};

const riskTemplate = {
    tipoRisco: 'Técnico',
    risco: '',
    estrategia: 'Mitigar',
    acao: '',
    impacto: 'Médio',
    mitigacao: ''
};

const securityProfileTemplate = {
    nivelAcesso: 'Usuário',
    plataforma: '',
    ambiente: 'Produção',
    gruposAcesso: '',
    itemConfig: '',
    areaNegocio: '',
    usuarios: '',
    loginAcesso: '',
    justificativa: ''
};

const CategoryHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="category-header-group">
        <h3 className="category-title">{title}</h3>
        {subtitle && <p className="category-subtitle">{subtitle}</p>}
    </div>
);

const HighlightBox = ({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) => (
    <div style={{ 
        border: '1px solid var(--sipal-teal)', 
        borderRadius: '8px', 
        padding: '1.5rem', 
        marginBottom: '1.5rem',
        backgroundColor: '#fdfdfd'
    }}>
        <h4 style={{ color: 'var(--sipal-blue)', margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700' }}>{title}</h4>
        <p style={{ fontSize: '0.9rem', color: '#444', marginBottom: '1rem' }}>{subtitle}</p>
        {children}
    </div>
);

export const NewRequestPage = ({ addRequest, currentUser, onSaveDraft, onAutoSaveDraft }: any) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({});
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
    const [submittedRequestId, setSubmittedRequestId] = useState(null);
    const [mailtoLink, setMailtoLink] = useState('');
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');
    const [uploadStatus, setUploadStatus] = useState<{success: boolean, message: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);

    const [formData, setFormData] = useState<any>(() => {
        const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const data = parsed.formData || parsed;
            if (currentUser?.name) data.informacoesGerais.liderMudanca = currentUser.name;
            return data;
        }
        const data = JSON.parse(JSON.stringify(initialFormData));
        
        // Garante que seções dinâmicas comecem com 1 item aberto
        data.planoImplantacao = [{ ...activityTemplate, id: newId() }];
        data.planoRetorno = [{ ...activityTemplate, id: newId() }];
        data.planoComunicacao = [{ ...communicationTemplate, id: newId() }];
        data.planoRiscos = [{ ...riskTemplate, id: newId() }];
        data.cadernoTestes = [{ ...testTemplate, id: newId() }];
        data.segurancaAcessos.perfis = [{ ...securityProfileTemplate, id: newId() }];
        data.contatos = [{ ...contactTemplate, id: newId() }];

        if (currentUser?.name) {
            data.informacoesGerais.liderMudanca = currentUser.name;
            data.informacoesGerais.solicitante = currentUser.name;
        }
        return data;
    });

    useEffect(() => {
        const stored = localStorage.getItem(OCCUPIED_SLOTS_KEY);
        if (stored) setOccupiedSlots(JSON.parse(stored));

        const timer = setInterval(() => {
            if (formData.informacoesGerais.motivoMudanca.trim()) {
                const draftId = onAutoSaveDraft(formData, currentDraftId);
                setCurrentDraftId(draftId);
                setAutoSaveStatus('Rascunho salvo automaticamente!');
                setTimeout(() => setAutoSaveStatus(''), 5000);
            }
        }, 120000);
        return () => clearInterval(timer);
    }, [formData, currentDraftId, onAutoSaveDraft]);

    useEffect(() => {
        localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ formData, draftId: currentDraftId }));
    }, [formData, currentDraftId]);

    const visibleStepIndexes = useMemo(() => {
        const isSAP = formData.informacoesGerais.referenteSAP === 'Sim';
        return steps.map((_, i) => i).filter(i => {
            if (!isSAP && (i === 2 || i === 10)) return false;
            return true;
        });
    }, [formData.informacoesGerais.referenteSAP]);

    const validateStep = (idx: number, fullCheck: boolean = false) => {
        const errors: any[] = [];
        const { informacoesGerais, planoImplantacao, planoRetorno, checklist } = formData;

        if (idx === 0 || fullCheck) {
            if (!informacoesGerais.dataMudanca) errors.push({ message: 'Selecione a "Data da Mudança".' });
            if (!informacoesGerais.sistemasAfetados || informacoesGerais.sistemasAfetados.length === 0) errors.push({ message: 'Selecione ao menos um "Sistema Afetado".' });
            if (!informacoesGerais.solicitante) errors.push({ message: 'O campo "Solicitante" é obrigatório.' });
        }
        if (idx === 1 || fullCheck) {
            if (planoImplantacao.length === 0) errors.push({ message: 'Página 1: Adicione ao menos uma atividade de implantação.' });
        }
        if (idx === 4 || fullCheck) {
            if (planoRetorno.length === 0) errors.push({ message: 'Página 4: Adicione ao menos uma ação de retorno.' });
        }
        if (idx === 9 || fullCheck) {
            const unanswered = checklist.some((item: any) => !item.answer);
            if (unanswered) errors.push({ message: 'Página 9: Conclua o preenchimento de todos os itens do checklist.' });
        }

        if (!fullCheck) {
            setCompletedSteps(prev => ({ ...prev, [idx]: errors.length === 0 }));
            setValidationErrors(errors);
        }
        return errors;
    };

    const handleNext = () => {
        const errors = validateStep(currentStep);
        if (errors.length === 0) {
            const curIdx = visibleStepIndexes.indexOf(currentStep);
            if (curIdx < visibleStepIndexes.length - 1) {
                setCurrentStep(visibleStepIndexes[curIdx + 1]);
                window.scrollTo(0, 0);
            }
        } else {
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        const curIdx = visibleStepIndexes.indexOf(currentStep);
        if (curIdx > 0) {
            setCurrentStep(visibleStepIndexes[curIdx - 1]);
            setValidationErrors([]);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        const allErrors = validateStep(-1, true);
        if (allErrors.length > 0) {
            setValidationErrors(allErrors);
            window.scrollTo(0, 0);
            return;
        }

        const newIdGenerated = addRequest(formData, currentDraftId);
        setSubmittedRequestId(newIdGenerated);
        
        setUploadStatus(null);
        const result = await generateAndUploadPdf(formData, newIdGenerated);
        setUploadStatus(result);

        setMailtoLink(`mailto:cab@sipal.com.br?subject=Nova RDM: ${newIdGenerated}`);
        setCurrentStep(steps.length - 1);
        localStorage.removeItem(WIZARD_STORAGE_KEY);
        window.scrollTo(0, 0);
    };

    const handleManualRetryUpload = async () => {
        if (!submittedRequestId) return;
        setUploadStatus(null);
        const result = await generateAndUploadPdf(formData, submittedRequestId);
        setUploadStatus(result);
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        const [section, field] = name.split('_');
        setFormData((prev: any) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    const updateChecklist = (section: string, idx: number, field: string, value: any) => {
        setFormData((prev: any) => {
            const newList = [...prev[section]];
            const items = section === 'checklist' ? checklistItemsStandard : checklistSAPItems;
            const targetQuestion = items[idx].question;
            const actualIdx = prev[section].findIndex((item:any) => item.question === targetQuestion);
            if (actualIdx !== -1) {
                newList[actualIdx] = { ...newList[actualIdx], [field]: value };
            }
            return { ...prev, [section]: newList };
        });
    };

    const addRow = (section: string, def: any) => {
        setFormData((prev: any) => {
            const parts = section.split('.');
            if (parts.length === 2) {
                return {
                    ...prev,
                    [parts[0]]: { 
                        ...prev[parts[0]], 
                        [parts[1]]: [...prev[parts[0]][parts[1]], { ...def, id: newId() }] 
                    }
                };
            }
            return { ...prev, [section]: [...prev[section], { ...def, id: newId() }] };
        });
    };

    const removeRow = (section: string, idx: number) => {
        setFormData((prev: any) => {
            const parts = section.split('.');
            if (parts.length === 2) {
                const newList = [...prev[parts[0]][parts[1]]];
                newList.splice(idx, 1);
                return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: newList } };
            }
            const newList = [...prev[section]];
            newList.splice(idx, 1);
            return { ...prev, [section]: newList };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles: Anexo[] = Array.from(e.target.files).map((file: any) => ({
            name: file.name,
            size: file.size,
            type: file.type
        }));
        setFormData((prev:any) => ({ ...prev, anexos: [...prev.anexos, ...newFiles] }));
    };

    const renderActivityCard = (section: string, item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const parts = section.split('.');
                const newList = parts.length === 2 ? [...prev[parts[0]][parts[1]]] : [...prev[section]];
                newList[idx] = { ...newList[idx], [field]: value };
                return parts.length === 2 ? { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: newList } } : { ...prev, [section]: newList };
            });
        };

        const isImplantacao = section.includes('Implantacao');
        const isRetorno = section.includes('Retorno');

        return (
            <div key={item.id} className="implementation-card">
                <div className="implementation-card-header"> 
                    <h4>{isRetorno ? `Ação de Retorno #${idx + 1}` : `Atividade #${idx + 1}`}: {item.nomeAtividade || item.descricao || 'Sem nome'}</h4> 
                    <button onClick={() => removeRow(section, idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem' }}>
                    <div className="form-field full-width">
                        <label>{isRetorno ? 'Nome da Ação' : 'Nome da Atividade'}</label>
                        <input type="text" value={item.nomeAtividade || ''} onChange={(e) => updateField('nomeAtividade', e.target.value)} />
                    </div>
                    
                    {isImplantacao && (
                        <div className="form-field">
                            <label>Etapa</label>
                            <select value={item.etapa || 'Pré Implantação'} onChange={(e) => updateField('etapa', e.target.value)}>
                                <option value="Pré Implantação">Pré-implantação</option>
                                <option value="Implantação">Implantação</option>
                                <option value="Pós Implantação">Pós-implantação</option>
                            </select>
                        </div>
                    )}

                    {isRetorno && (
                        <div className="form-field">
                            <label>Status</label>
                            <select value={item.status || 'Não iniciado'} onChange={(e) => updateField('status', e.target.value)}>
                                <option value="Não iniciado">Não iniciado</option>
                                <option value="Em andamento">Em andamento</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Com problema">Com problema</option>
                            </select>
                        </div>
                    )}

                    <div className="form-field">
                        <label>Responsável</label>
                        <input type="text" value={item.responsavel} onChange={(e) => updateField('responsavel', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Data Planejada</label>
                        <input type="date" value={item.dataPlanejada} onChange={(e) => updateField('dataPlanejada', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Hora Planejada</label>
                        <input type="time" value={item.horaPlanejada} onChange={(e) => updateField('horaPlanejada', e.target.value)} />
                    </div>

                    <div className="form-field full-width">
                        <label>Descrição Detalhada</label>
                        <textarea value={item.descricao || ''} onChange={(e) => updateField('descricao', e.target.value)} style={{ minHeight: '60px' }}></textarea>
                    </div>
                </div>
            </div>
        );
    };

    const renderCommunicationCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.planoComunicacao];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, planoComunicacao: newList };
            });
        };

        return (
            <div key={item.id} className="implementation-card" style={{ borderLeftColor: '#012169' }}>
                <div className="implementation-card-header"> 
                    <h4 style={{ color: 'var(--sipal-blue)' }}>Item #{idx + 1}</h4> 
                    <button onClick={() => removeRow('planoComunicacao', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem' }}>
                    <div className="form-field">
                        <label>Data</label>
                        <input type="date" value={item.data || ''} onChange={(e) => updateField('data', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Hora</label>
                        <input type="time" value={item.hora || ''} onChange={(e) => updateField('hora', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Status</label>
                        <input type="text" value={item.status || ''} onChange={(e) => updateField('status', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Meio</label>
                        <select value={item.meio || 'E-mail'} onChange={(e) => updateField('meio', e.target.value)}>
                            <option value="E-mail">E-mail</option>
                            <option value="Teams">Teams</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Telefone">Telefone</option>
                            <option value="Presencial">Presencial</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>

                    <div className="form-field full-width">
                        <label>Atividade/Público</label>
                        <input type="text" value={item.atividadePublico || ''} onChange={(e) => updateField('atividadePublico', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Responsável</label>
                        <input type="text" value={item.responsavel || ''} onChange={(e) => updateField('responsavel', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Contato Escalonamento</label>
                        <input type="text" value={item.contatoEscalonamento || ''} onChange={(e) => updateField('contatoEscalonamento', e.target.value)} />
                    </div>

                    <div className="form-field full-width">
                        <label>Observação</label>
                        <textarea value={item.observacao || ''} onChange={(e) => updateField('observacao', e.target.value)} style={{ minHeight: '100px' }}></textarea>
                    </div>
                </div>
            </div>
        );
    };

    const renderRiskCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.planoRiscos];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, planoRiscos: newList };
            });
        };

        return (
            <div key={item.id} className="implementation-card" style={{ borderLeftColor: '#dc3545' }}>
                <div className="implementation-card-header"> 
                    <h4 style={{ color: 'var(--sipal-blue)' }}>Risco #{idx + 1}</h4> 
                    <button onClick={() => removeRow('planoRiscos', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem' }}>
                    <div className="form-field">
                        <label>Tipo Risco</label>
                        <select value={item.tipoRisco || 'Técnico'} onChange={(e) => updateField('tipoRisco', e.target.value)}>
                            <option value="Técnico">Técnico</option>
                            <option value="Operacional">Operacional</option>
                            <option value="Segurança">Segurança</option>
                            <option value="Negócio">Negócio</option>
                            <option value="Externo">Externo</option>
                        </select>
                    </div>

                    <div className="form-field full-width">
                        <label>Risco</label>
                        <input type="text" value={item.risco || ''} onChange={(e) => updateField('risco', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Estratégia</label>
                        <select value={item.estrategia || 'Mitigar'} onChange={(e) => updateField('estrategia', e.target.value)}>
                            <option value="Mitigar">Mitigar</option>
                            <option value="Evitar">Evitar</option>
                            <option value="Transferir">Transferir</option>
                            <option value="Aceitar">Aceitar</option>
                        </select>
                    </div>

                    <div className="form-field full-width">
                        <label>Ação</label>
                        <textarea value={item.acao || ''} onChange={(e) => updateField('acao', e.target.value)} style={{ minHeight: '80px' }}></textarea>
                    </div>

                    <div className="form-field">
                        <label>Impacto</label>
                        <select value={item.impacto || 'Médio'} onChange={(e) => updateField('impacto', e.target.value)}>
                            <option value="Baixo">Baixo</option>
                            <option value="Médio">Médio</option>
                            <option value="Alto">Alto</option>
                            <option value="Muito Alto">Muito Alto</option>
                        </select>
                    </div>

                    <div className="form-field full-width">
                        <label>Mitigação</label>
                        <textarea value={item.mitigacao || ''} onChange={(e) => updateField('mitigacao', e.target.value)} style={{ minHeight: '80px' }}></textarea>
                    </div>
                </div>
            </div>
        );
    };

    const renderSecurityProfileCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.segurancaAcessos.perfis];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, segurancaAcessos: { ...prev.segurancaAcessos, perfis: newList } };
            });
        };

        return (
            <div key={item.id} className="implementation-card" style={{ borderLeftColor: '#012169' }}>
                <div className="implementation-card-header"> 
                    <h4 style={{ color: 'var(--sipal-blue)' }}>Perfil #{idx + 1}</h4> 
                    <button onClick={() => removeRow('segurancaAcessos.perfis', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem' }}>
                    <div className="form-field">
                        <label>Nível de acesso</label>
                        <select value={item.nivelAcesso || 'Usuário'} onChange={(e) => updateField('nivelAcesso', e.target.value)}>
                            <option value="Usuário">Usuário</option>
                            <option value="Gestor">Gestor</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Especialista">Especialista</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Plataforma</label>
                        <input type="text" value={item.plataforma || ''} onChange={(e) => updateField('plataforma', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Ambiente</label>
                        <select value={item.ambiente || 'Produção'} onChange={(e) => updateField('ambiente', e.target.value)}>
                            <option value="Produção">Produção</option>
                            <option value="Homologação">Homologação</option>
                            <option value="Desenvolvimento">Desenvolvimento</option>
                            <option value="Treinamento">Treinamento</option>
                        </select>
                    </div>

                    <div className="form-field full-width">
                        <label>Grupos de acesso</label>
                        <input type="text" value={item.gruposAcesso || ''} onChange={(e) => updateField('gruposAcesso', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Item de Configuração</label>
                        <input type="text" value={item.itemConfig || ''} onChange={(e) => updateField('itemConfig', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Área de Negócio</label>
                        <input type="text" value={item.areaNegocio || ''} onChange={(e) => updateField('areaNegocio', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Usuários</label>
                        <input type="text" value={item.usuarios || ''} onChange={(e) => updateField('usuarios', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Login de acesso</label>
                        <input type="text" value={item.loginAcesso || ''} onChange={(e) => updateField('loginAcesso', e.target.value)} />
                    </div>

                    <div className="form-field full-width">
                        <label>Justificativa</label>
                        <textarea value={item.justificativa || ''} onChange={(e) => updateField('justificativa', e.target.value)} style={{ minHeight: '80px' }}></textarea>
                    </div>
                </div>
            </div>
        );
    };

    const renderContactCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.contatos];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, contatos: newList };
            });
        };

        return (
            <div key={item.id} className="implementation-card" style={{ borderLeftColor: '#012169' }}>
                <div className="implementation-card-header"> 
                    <h4 style={{ color: 'var(--sipal-blue)' }}>Contato #{idx + 1}</h4> 
                    <button onClick={() => removeRow('contatos', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-field">
                        <label>Nome</label>
                        <input type="text" value={item.nome || ''} onChange={(e) => updateField('nome', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Cargo</label>
                        <input type="text" value={item.cargo || ''} onChange={(e) => updateField('cargo', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>E-mail</label>
                        <input type="email" value={item.email || ''} onChange={(e) => updateField('email', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Telefones</label>
                        <input type="text" value={item.telefones || ''} onChange={(e) => updateField('telefones', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Comunicação</label>
                        <input type="text" value={item.comunicacao || ''} onChange={(e) => updateField('comunicacao', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Local de Atuação</label>
                        <input type="text" value={item.localAtuacao || ''} onChange={(e) => updateField('localAtuacao', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Líder Imediato</label>
                        <input type="text" value={item.liderImediato || ''} onChange={(e) => updateField('liderImediato', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>E-mail Líder</label>
                        <input type="email" value={item.emailLider || ''} onChange={(e) => updateField('emailLider', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Unidade/Filial</label>
                        <input type="text" value={item.unidadeFilial || ''} onChange={(e) => updateField('unidadeFilial', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Área</label>
                        <input type="text" value={item.area || ''} onChange={(e) => updateField('area', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Gestor da Área</label>
                        <input type="text" value={item.gestorArea || ''} onChange={(e) => updateField('gestorArea', e.target.value)} />
                    </div>
                    <div className="form-field" style={{ visibility: 'hidden' }}></div>

                    <div className="form-field full-width">
                        <label>Comunicação Envolvida</label>
                        <input type="text" value={item.comunEnvolvida || ''} onChange={(e) => updateField('comunEnvolvida', e.target.value)} />
                    </div>
                </div>
            </div>
        );
    };

    const renderTestCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.cadernoTestes];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, cadernoTestes: newList };
            });
        };

        return (
            <div key={item.id} className="implementation-card" style={{ borderLeftColor: 'var(--sipal-teal)' }}>
                <div className="implementation-card-header"> 
                    <h4 style={{ color: 'var(--sipal-blue)' }}>Teste #{idx + 1}: {item.nomeTeste || 'Novo Teste'}</h4> 
                    <button onClick={() => removeRow('cadernoTestes', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem' }}>
                    <div className="form-field full-width">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Nome do Teste <Tooltip text="Um nome claro para identificar o teste." />
                        </label>
                        <input type="text" value={item.nomeTeste || ''} onChange={(e) => updateField('nomeTeste', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Plano <Tooltip text="Defina o escopo do plano de teste." />
                        </label>
                        <select value={item.plano || 'Funcional'} onChange={(e) => updateField('plano', e.target.value)}>
                            <option value="Funcional">Funcional</option>
                            <option value="Não Funcional">Não Funcional</option>
                            <option value="Regressivo">Regressivo</option>
                            <option value="UAT (User Acceptance Testing)">UAT (User Acceptance Testing)</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Tipo de Teste <Tooltip text="A categoria técnica do teste realizado." />
                        </label>
                        <select value={item.tipoTeste || 'TU - Teste Unitário'} onChange={(e) => updateField('tipoTeste', e.target.value)}>
                            <option value="TU - Teste Unitário">TU - Teste Unitário</option>
                            <option value="TI - Teste Integrado">TI - Teste Integrado</option>
                            <option value="TH - Teste de Homologação">TH - Teste de Homologação</option>
                            <option value="TR - Teste Regressivo">TR - Teste Regressivo</option>
                            <option value="TS - Teste de Segurança">TS - Teste de Segurança</option>
                            <option value="TP - Teste de Performance">TP - Teste de Performance</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Data Planejada <Tooltip text="A data em que o teste está programado para ocorrer." />
                        </label>
                        <input type="date" value={item.dataPlanejada} onChange={(e) => updateField('dataPlanejada', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Hora Planejada <Tooltip text="O horário de início previsto para o teste." />
                        </label>
                        <input type="time" value={item.horaPlanejada} onChange={(e) => updateField('horaPlanejada', e.target.value)} />
                    </div>

                    <div className="form-field full-width">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Atividade de Teste <Tooltip text="Descrição detalhada do que será testado." />
                        </label>
                        <textarea value={item.atividade || ''} onChange={(e) => updateField('atividade', e.target.value)} style={{ minHeight: '80px' }}></textarea>
                    </div>

                    <div className="form-field full-width">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Link do Teste <Tooltip text="URL ou link para a evidência do teste (ex: Jira, Wiki, Sharepoint)." />
                        </label>
                        <input type="text" placeholder="Cole o link para a evidência do teste" value={item.linkTeste || ''} onChange={(e) => updateField('linkTeste', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Predecessora <Tooltip text="ID ou nome da atividade que deve ocorrer antes deste teste." />
                        </label>
                        <input type="text" value={item.predecessora || ''} onChange={(e) => updateField('predecessora', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Responsável <Tooltip text="Pessoa responsável pela execução do teste." />
                        </label>
                        <input type="text" value={item.responsavel || ''} onChange={(e) => updateField('responsavel', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Departamento</label>
                        <input type="text" value={item.departamento || ''} onChange={(e) => updateField('departamento', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Item de Configuração <Tooltip text="O sistema ou componente específico sendo testado." />
                        </label>
                        <input type="text" value={item.itemConfiguracao || ''} onChange={(e) => updateField('itemConfiguracao', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Tempo de Execução <Tooltip text="Estimativa de duração (ex: 02:30)." />
                        </label>
                        <input type="text" placeholder="Ex: 02:30" value={item.tempoExecucao || ''} onChange={(e) => updateField('tempoExecucao', e.target.value)} />
                    </div>
                </div>
            </div>
        );
    };

    const renderChecklistSection = (sectionName: string, itemsList: any[]) => {
        const grouped = itemsList.reduce((acc:any, item) => { (acc[item.scope] = acc[item.scope] || []).push(item); return acc; }, {});
        return (
            <div className="accordion">
                {Object.entries(grouped).map(([scope, items]: [string, any]) => (
                    <div key={scope} className="accordion-item">
                        <button className="accordion-header" onClick={() => setExpandedScopes(prev => ({ ...prev, [scope]: !prev[scope] }))}>
                            <div className="accordion-title-wrapper"> <span>{scope}</span> </div>
                            <ExpandIcon isExpanded={!!expandedScopes[scope]} />
                        </button>
                        {expandedScopes[scope] && (
                            <div className="accordion-content">
                                {items.map((item: any) => {
                                    const actualGlobalIdx = itemsList.indexOf(item);
                                    const saved = formData[sectionName].find((f: any) => f.question === item.question) || { answer: '', justification: '' };
                                    return (
                                        <div key={item.question} className="checklist-question-container">
                                            <div className="checklist-question-text">{item.question}</div>
                                            <div className="checklist-answer-buttons">
                                                {['Sim', 'Não', 'N/A'].map(opt => (
                                                    <button key={opt} className={`checklist-answer-btn ${opt === 'Sim' ? 'sim' : opt === 'Não' ? 'nao' : 'na'} ${saved.answer === opt ? 'selected' : ''}`} onClick={() => updateChecklist(sectionName, actualGlobalIdx, 'answer', opt)}>
                                                        {saved.answer === opt && <CheckIcon />} <span>{opt}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {saved.answer === 'Não' && (
                                                <div className="form-field" style={{ marginTop: '1.25rem' }}>
                                                    <label>Justificativa obrigatória:</label>
                                                    <textarea value={saved.justification || ''} onChange={(e) => updateChecklist(sectionName, actualGlobalIdx, 'justification', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="card">
            <h2>Nova Requisição de Mudança</h2>
            <WizardProgressBar currentStep={currentStep} formData={formData} completedSteps={completedSteps} onStepClick={(step: number) => { if (step < currentStep) setCurrentStep(step); }} />
            
            {validationErrors.length > 0 && (
                <div className="error-message-box">
                    <div className="error-box-header"><AlertIcon /> Pendências:</div>
                    <ul>{validationErrors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
                </div>
            )}

            <div className="step-container">
                {currentStep === 0 && (
                    <div className="step-content">
                        <CategoryHeader title="Informações Gerais" />
                        
                        <HighlightBox title="Mudança SAP" subtitle="Esta mudança é referente ao SAP?">
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input type="radio" name="informacoesGerais_referenteSAP" value="Sim" checked={formData.informacoesGerais.referenteSAP === 'Sim'} onChange={handleChange} /> Sim
                                </label>
                                <label className="radio-label">
                                    <input type="radio" name="informacoesGerais_referenteSAP" value="Não" checked={formData.informacoesGerais.referenteSAP === 'Não'} onChange={handleChange} /> Não
                                </label>
                            </div>
                        </HighlightBox>

                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div className="form-field">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Líder da Mudança <Tooltip text="Responsável técnico pela execução e acompanhamento da mudança." />
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.informacoesGerais.liderMudanca} 
                                    readOnly 
                                    className="read-only-field" 
                                />
                            </div>
                            <div className="form-field">
                                <label>Solicitante</label>
                                <input 
                                    type="text" 
                                    name="informacoesGerais_solicitante"
                                    value={formData.informacoesGerais.solicitante} 
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-field">
                                <label>Líder do Produto (se aplicável)</label>
                                <input type="text" name="informacoesGerais_liderProduto" value={formData.informacoesGerais.liderProduto} onChange={handleChange} />
                            </div>
                            <div className="form-field">
                                <label>Data da Mudança</label>
                                <input type="date" name="informacoesGerais_dataMudanca" value={formData.informacoesGerais.dataMudanca} onChange={handleChange} />
                            </div>

                            <div className="form-field full-width" style={{ marginTop: '0.5rem' }}>
                                <label>Motivo da Mudança</label>
                                <textarea name="informacoesGerais_motivoMudanca" value={formData.informacoesGerais.motivoMudanca} onChange={handleChange} style={{ minHeight: '80px' }}></textarea>
                            </div>

                            <div className="form-field full-width">
                                <label>Qual o impacto de NÃO realizar a mudança?</label>
                                <textarea name="informacoesGerais_impactoNaoRealizar" value={formData.informacoesGerais.impactoNaoRealizar} onChange={handleChange} style={{ minHeight: '80px' }}></textarea>
                            </div>

                            <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
                                    <div className="form-field">
                                        <label>Classificação</label>
                                        <select name="informacoesGerais_classificacao" value={formData.informacoesGerais.classificacao} onChange={handleChange}>
                                            <option value="Padrão">Padrão</option>
                                            <option value="Normal">Normal</option>
                                            <option value="Emergencial">Emergencial</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Existem restrições para a realização da mudança?</label>
                                        <input type="text" name="informacoesGerais_restricoesMudanca" value={formData.informacoesGerais.restricoesMudanca} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-field full-width" style={{ marginTop: '0.5rem' }}>
                                <label>Serviços Afetados</label>
                                <MultiSelect optionsData={servicosData} selected={formData.informacoesGerais.servicosAfetados} onChange={(val:any) => setFormData((p:any)=>({...p, informacoesGerais: {...p.informacoesGerais, servicosAfetados: val}}))} placeholder="Selecione os serviços..." />
                            </div>

                            <div className="form-field full-width">
                                <label>Sistemas Afetados</label>
                                <MultiSelect optionsData={sistemasAfetadosData} selected={formData.informacoesGerais.sistemasAfetados} onChange={(val:any) => setFormData((p:any)=>({...p, informacoesGerais: {...p.informacoesGerais, sistemasAfetados: val}}))} placeholder="Selecione os sistemas..." />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <HighlightBox title="Indisponibilidade de Serviço" subtitle="Haverá indisponibilidade de algum serviço durante a mudança?">
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input type="radio" name="informacoesGerais_indisponibilidade" value="Sim" checked={formData.informacoesGerais.indisponibilidade === 'Sim'} onChange={handleChange} /> Sim
                                    </label>
                                    <label className="radio-label">
                                        <input type="radio" name="informacoesGerais_indisponibilidade" value="Não" checked={formData.informacoesGerais.indisponibilidade === 'Não'} onChange={handleChange} /> Não
                                    </label>
                                </div>
                                {formData.informacoesGerais.indisponibilidade === 'Sim' && (
                                    <div className="form-grid" style={{ marginTop: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="form-field">
                                            <label>Início da Indisponibilidade</label>
                                            <input type="datetime-local" name="informacoesGerais_indisponibilidadeInicio" value={formData.informacoesGerais.indisponibilidadeInicio} onChange={handleChange} />
                                        </div>
                                        <div className="form-field">
                                            <label>Fim da Indisponibilidade</label>
                                            <input type="datetime-local" name="informacoesGerais_indisponibilidadeFim" value={formData.informacoesGerais.indisponibilidadeFim} onChange={handleChange} />
                                        </div>
                                    </div>
                                )}
                            </HighlightBox>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="step-content">
                        <CategoryHeader title="Plano de Implantação" />
                        <div className="implementation-plan-list">
                            {formData.planoImplantacao.map((item:any, idx:number) => renderActivityCard('planoImplantacao', item, idx))}
                            <button onClick={() => addRow('planoImplantacao', activityTemplate)} className="add-row-btn">+ Adicionar Atividade</button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="step-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                            <CategoryHeader title="Caderno de Testes" />
                            <Tooltip text="Documente aqui o plano e os resultados esperados dos testes realizados." />
                        </div>
                        <div className="implementation-plan-list">
                            {formData.cadernoTestes && formData.cadernoTestes.map((item: any, idx: number) => renderTestCard(item, idx))}
                            <button onClick={() => addRow('cadernoTestes', testTemplate)} className="add-row-btn">+ Adicionar Novo Teste</button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="step-content">
                        <CategoryHeader title="Plano de Retorno" />
                        <div className="implementation-plan-list">
                            {formData.planoRetorno.map((item:any, idx:number) => renderActivityCard('planoRetorno', item, idx))}
                            <button onClick={() => addRow('planoRetorno', activityTemplate)} className="add-row-btn">+ Adicionar Ação de Retorno</button>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="step-content">
                        <CategoryHeader title="Plano de Comunicação" />
                        
                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '2rem', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                                {[
                                    { label: 'Partes envolvidas validaram o plano?', key: 'partesEnvolvidasValidaram' },
                                    { label: 'Processo de acompanhamento comunicado?', key: 'processoAcompanhamentoComunicado' },
                                    { label: 'Comunicação de retorno contemplada?', key: 'comunicacaoEventoRetorno' },
                                    { label: 'Passo a passo para aplicação existe?', key: 'passoAPassoAplicacao' },
                                    { label: 'Tabela de contatos preenchida?', key: 'tabelaContatosPreenchida' },
                                    { label: 'Pontos focais informados?', key: 'pontosFocaisInformados' }
                                ].map((q) => (
                                    <div key={q.key} className="form-field">
                                        <label style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--sipal-blue)', lineHeight: '1.3' }}>{q.label}</label>
                                        <div className="checklist-answer-buttons">
                                            {['Sim', 'Não'].map(opt => (
                                                <button 
                                                    key={opt}
                                                    type="button"
                                                    className={`checklist-answer-btn ${opt === 'Sim' ? 'sim' : 'nao'} ${formData.comunicacaoChecklist[q.key] === opt ? 'selected' : ''}`}
                                                    onClick={() => setFormData((prev:any) => ({
                                                        ...prev,
                                                        comunicacaoChecklist: { ...prev.comunicacaoChecklist, [q.key]: opt }
                                                    }))}
                                                    style={{ minWidth: '80px', height: '36px' }}
                                                >
                                                    {formData.comunicacaoChecklist[q.key] === opt && <CheckIcon />} <span>{opt}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <CategoryHeader title="Detalhamento da Comunicação" />
                        <div className="implementation-plan-list">
                            {formData.planoComunicacao.map((item: any, idx: number) => renderCommunicationCard(item, idx))}
                            <button onClick={() => addRow('planoComunicacao', communicationTemplate)} className="add-row-btn">+ Adicionar Comunicação</button>
                        </div>
                    </div>
                )}

                {currentStep === 6 && (
                    <div className="step-content">
                        <CategoryHeader title="Risco de Mudança" />
                        
                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '2rem', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                                {[
                                    { label: 'Plano de implantação claro sobre riscos/gatilhos?', key: 'planoRetornoClaro' },
                                    { label: 'Stakeholders consultados sobre riscos?', key: 'stakeholdersConsultados' }
                                ].map((q) => (
                                    <div key={q.key} className="form-field">
                                        <label style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--sipal-blue)', lineHeight: '1.3' }}>{q.label}</label>
                                        <div className="checklist-answer-buttons">
                                            {['Sim', 'Não'].map(opt => (
                                                <button 
                                                    key={opt}
                                                    type="button"
                                                    className={`checklist-answer-btn ${opt === 'Sim' ? 'sim' : 'nao'} ${formData.riscosGerais[q.key] === opt ? 'selected' : ''}`}
                                                    onClick={() => setFormData((prev:any) => ({
                                                        ...prev,
                                                        riscosGerais: { ...prev.riscosGerais, [q.key]: opt }
                                                    }))}
                                                    style={{ minWidth: '80px', height: '36px' }}
                                                >
                                                    {formData.riscosGerais[q.key] === opt && <CheckIcon />} <span>{opt}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <CategoryHeader title="Detalhamento dos Riscos" />
                        <div className="implementation-plan-list">
                            {formData.planoRiscos.map((item: any, idx: number) => renderRiskCard(item, idx))}
                            <button onClick={() => addRow('planoRiscos', riskTemplate)} className="add-row-btn">+ Adicionar Risco</button>
                        </div>
                    </div>
                )}

                {currentStep === 7 && (
                    <div className="step-content">
                        <CategoryHeader title="Segurança e Acessos" />
                        <div className="implementation-plan-list">
                            {formData.segurancaAcessos.perfis.map((item: any, idx: number) => renderSecurityProfileCard(item, idx))}
                            <button onClick={() => addRow('segurancaAcessos.perfis', securityProfileTemplate)} className="add-row-btn">+ Adicionar Perfil</button>
                        </div>
                    </div>
                )}

                {currentStep === 8 && (
                    <div className="step-content">
                        <CategoryHeader title="Contatos" />
                        <div className="implementation-plan-list">
                            {formData.contatos.map((item: any, idx: number) => renderContactCard(item, idx))}
                            <button onClick={() => addRow('contatos', contactTemplate)} className="add-row-btn">+ Adicionar Contato</button>
                        </div>
                    </div>
                )}

                {currentStep === 9 && (
                    <div className="step-content">
                        <CategoryHeader title="Checklist de Governança" />
                        {renderChecklistSection('checklist', checklistItemsStandard)}
                    </div>
                )}

                {currentStep === 11 && (
                    <div className="step-content">
                        <CategoryHeader title="Anexos e Envio" />
                        <div className="upload-container">
                            <input type="file" multiple onChange={handleFileChange} id="file-upload-final" style={{display:'none'}} />
                            <label htmlFor="file-upload-final" className="upload-box">
                                <UploadIcon />
                                <p>Clique para anexar documentos complementares</p>
                            </label>
                        </div>
                        <div className="file-list">
                            {formData.anexos.map((f:Anexo, i:number) => (
                                <div key={i} className="file-item">
                                    <span className="file-name">{f.name}</span>
                                    <button onClick={() => removeRow('anexos', i)} className="remove-row-btn"><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentStep === steps.length - 1 && submittedRequestId ? (
                    <div className="step-content success-view" style={{ padding: '4rem 0', textAlign: 'center' }}>
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ background: '#f2fcf5', width: '100px', height: '100px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'var(--status-approved)', border: '1px solid #d3f9d8', boxShadow: '0 8px 16px rgba(40, 167, 69, 0.1)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                            <h2 style={{ color: 'var(--sipal-blue)', fontSize: '2.5rem', fontWeight: '700', border: 'none', marginBottom: '1rem', letterSpacing: '-1px' }}>Mudança Enviada!</h2>
                            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Sua solicitação foi registrada com sucesso sob o protocolo abaixo.</p>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '1rem 2rem', backgroundColor: '#f0f4ff', border: '1px solid #dbe4ff', borderRadius: '12px', marginBottom: '3rem' }}>
                                <span style={{ color: '#666', fontWeight: '500', fontSize: '0.9rem' }}>Protocolo:</span>
                                <strong style={{ color: 'var(--sipal-blue)', fontSize: '1.25rem', fontFamily: 'monospace' }}>{submittedRequestId}</strong>
                            </div>

                            {uploadStatus && (
                                <div style={{ 
                                    padding: '1rem', 
                                    borderRadius: '8px', 
                                    marginBottom: '2rem', 
                                    backgroundColor: uploadStatus.success ? '#e6fffa' : '#fff5f5', 
                                    border: `1px solid ${uploadStatus.success ? '#b2f5ea' : '#feb2b2'}`,
                                    color: uploadStatus.success ? '#234e52' : '#742a2a'
                                }}>
                                    {uploadStatus.success ? <CheckIcon /> : <AlertIcon />}
                                    <span style={{ marginLeft: '8px', fontWeight: '600' }}>{uploadStatus.message}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="submit-btn" style={{ padding: '1rem 2rem', minWidth: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--sipal-teal)', borderRadius: '8px', fontSize: '1rem' }} onClick={handleManualRetryUpload}> <UploadIcon /> Reenviar Relatório PDF </button>
                                <a href={mailtoLink} className="nav-button secondary" style={{ padding: '1rem 2rem', minWidth: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', fontSize: '1rem', backgroundColor: '#f1f3f5', color: 'var(--sipal-blue)', textDecoration: 'none' }}> Notificar Comitê via E-mail </a>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {currentStep < steps.length - 1 && (
                <div className="wizard-nav-sticky">
                    <span style={{color: '#008479', fontWeight: '600', fontSize: '0.9rem'}}>{autoSaveStatus}</span>
                    <div className="main-nav-buttons">
                        <button type="button" className="nav-button secondary" onClick={() => onSaveDraft(formData, currentDraftId)}>Salvar Rascunho</button>
                        <button type="button" onClick={handleBack} className="nav-button secondary" disabled={visibleStepIndexes.indexOf(currentStep) === 0}>Voltar</button>
                        <button type="button" onClick={visibleStepIndexes.indexOf(currentStep) === visibleStepIndexes.length - 2 ? handleSubmit : handleNext} className="nav-button" style={{minWidth: '160px'}}>
                            {visibleStepIndexes.indexOf(currentStep) === visibleStepIndexes.length - 2 ? 'Finalizar e Enviar' : 'Próximo'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};