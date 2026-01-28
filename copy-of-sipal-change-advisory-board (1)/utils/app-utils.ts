
import jsPDF from 'jspdf';
import { steps, sipalBlue, sipalTeal } from '../constants/app-constants';

export const generateTimeSlots = () => {
    const slots = [];
    for(let h=8; h<18; h++) {
        for(let m=0; m<60; m+=20) {
            const sh = String(h).padStart(2,'0');
            const sm = String(m).padStart(2,'0');
            let eh = h; let em = m + 20;
            if(em >= 60) { eh++; em -= 60; }
            const seh = String(eh).padStart(2,'0');
            const sem = String(em).padStart(2,'0');
            slots.push(`${sh}:${sm} - ${seh}:${sem}`);
        }
    }
    return slots;
};

/**
 * Gera o PDF com design profissional, alinhamento simétrico e proteção contra quebras de contexto.
 */
export const generateAndUploadPdf = async (formData: any, requestId: string | null = null) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; // Margem mais larga para aspecto profissional
    const contentWidth = pageWidth - (margin * 2);
    let y = 0;

    const drawPageHeader = (isFirstPage: boolean) => {
        // Cabeçalho institucional elegante
        doc.setFillColor(1, 33, 105); // Sipal Blue
        doc.rect(0, 0, pageWidth, isFirstPage ? 35 : 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(isFirstPage ? 18 : 14);
        doc.text('SIPAL CAB', margin, 15);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('RELATÓRIO DE REQUISIÇÃO DE MUDANÇA', margin, isFirstPage ? 22 : 20);
        
        // Info no canto superior direito
        doc.setFontSize(8);
        doc.text(`PROTOCOLO: ${requestId || 'RDM-PREVIEW'}`, pageWidth - margin, 15, { align: 'right' });
        doc.text(`PÁGINA: ${doc.internal.pages.length - 1}`, pageWidth - margin, isFirstPage ? 22 : 20, { align: 'right' });
        
        y = isFirstPage ? 45 : 35;
        doc.setTextColor(0, 0, 0);
    };

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
            doc.addPage();
            drawPageHeader(false);
            return true;
        }
        return false;
    };

    const drawSectionTitle = (title: string) => {
        checkPageBreak(25); // Garante espaço para título + início de conteúdo
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(1, 33, 105);
        doc.text(title.toUpperCase(), margin, y);
        
        // Linha decorativa fina em Teal
        y += 2;
        doc.setDrawColor(0, 132, 121); // Sipal Teal
        doc.setLineWidth(0.8);
        doc.line(margin, y, margin + 25, y);
        
        y += 8;
        doc.setTextColor(0, 0, 0);
    };

    /**
     * Desenha um campo de dado formatado com label em negrito.
     * Suporta layout de 1 ou 2 colunas.
     */
    const drawField = (label: string, value: any, col: 1 | 2 = 1, isFullWidth: boolean = false) => {
        const safeValue = String(value || '-').trim();
        const colWidth = isFullWidth ? contentWidth : (contentWidth / 2) - 2;
        const startX = col === 1 ? margin : margin + (contentWidth / 2) + 2;
        
        doc.setFontSize(9);
        const splitValue = doc.splitTextToSize(safeValue, colWidth);
        const fieldHeight = (splitValue.length * 5) + 2;

        // Se for a primeira coluna ou full width, verificamos quebra. 
        // Se for a segunda coluna, assume-se que a primeira já verificou o espaço necessário da linha.
        if (col === 1 || isFullWidth) {
            checkPageBreak(fieldHeight);
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(`${label}:`, startX, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Se o texto for curto, coloca na frente do label
        const labelWidth = doc.getTextWidth(`${label}: `);
        if (splitValue.length === 1 && (labelWidth + doc.getTextWidth(safeValue)) < colWidth) {
            doc.text(safeValue, startX + labelWidth + 1, y);
            if (col === 2 || isFullWidth) y += 7;
        } else {
            y += 5;
            doc.text(splitValue, startX, y);
            y += (splitValue.length * 5);
        }
    };

    const drawTable = (items: any[], columns: {label: string, key: string, width: number}[]) => {
        if (!items || items.length === 0) return;
        
        checkPageBreak(20);
        
        // Header Estilizado
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 4, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        let currentX = margin;
        columns.forEach(col => {
            doc.text(col.label, currentX + 2, y + 1.5);
            currentX += (contentWidth * col.width) / 100;
        });
        
        y += 8;

        items.forEach((item, idx) => {
            let maxRowHeight = 7;
            const lines: any[] = [];
            
            // Cálculo de altura da linha
            columns.forEach(col => {
                const text = String(item[col.key] || '-');
                const split = doc.splitTextToSize(text, ((contentWidth * col.width) / 100) - 4);
                lines.push(split);
                const h = (split.length * 4) + 4;
                if (h > maxRowHeight) maxRowHeight = h;
            });

            checkPageBreak(maxRowHeight);

            // Zebra Striping discreto
            if (idx % 2 === 1) {
                doc.setFillColor(252, 252, 252);
                doc.rect(margin, y - 4, contentWidth, maxRowHeight, 'F');
            }

            currentX = margin;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            columns.forEach((col, cIdx) => {
                doc.text(lines[cIdx], currentX + 2, y);
                currentX += (contentWidth * col.width) / 100;
            });
            
            y += maxRowHeight;
            
            // Linha divisória fina
            doc.setDrawColor(240, 240, 240);
            doc.setLineWidth(0.1);
            doc.line(margin, y - 4, margin + contentWidth, y - 4);
        });
        y += 5;
    };

    // --- RENDERIZAÇÃO ---
    drawPageHeader(true);

    // 1. INFORMAÇÕES GERAIS
    drawSectionTitle('1. Informações Gerais');
    const ig = formData.informacoesGerais;
    
    // Grid de 2 colunas para campos curtos
    drawField('Líder da Mudança', ig.liderMudanca, 1);
    drawField('Solicitante', ig.solicitante, 2);
    
    drawField('Data da Mudança', ig.dataMudanca, 1);
    drawField('Classificação', ig.classificacao, 2);
    
    drawField('Sistemas Afetados', ig.sistemasAfetados?.join(', '), 1);
    drawField('Indisponibilidade', ig.indisponibilidade, 2);

    if (ig.indisponibilidade === 'Sim') {
        drawField('Janela Prevista', `${ig.indisponibilidadeInicio} até ${ig.indisponibilidadeFim}`, 1, true);
    }

    // Campos Longos ocupam largura total
    drawField('Motivo da Mudança', ig.motivoMudanca, 1, true);
    drawField('Impacto de Não Realizar', ig.impactoNaoRealizar, 1, true);

    // 2. PLANO DE IMPLANTAÇÃO
    if (formData.planoImplantacao?.length > 0) {
        drawSectionTitle('2. Plano de Implantação');
        drawTable(formData.planoImplantacao, [
            { label: 'Atividade', key: 'nomeAtividade', width: 45 },
            { label: 'Responsável', key: 'responsavel', width: 25 },
            { label: 'Data/Hora', key: 'dataPlanejada', width: 15 },
            { label: 'Etapa', key: 'etapa', width: 15 }
        ]);
    }

    // 3. PLANO DE RETORNO
    if (formData.planoRetorno?.length > 0) {
        drawSectionTitle('3. Plano de Retorno (Rollback)');
        drawTable(formData.planoRetorno, [
            { label: 'Ação Corretiva', key: 'nomeAtividade', width: 55 },
            { label: 'Responsável', key: 'responsavel', width: 30 },
            { label: 'Tempo Est.', key: 'tempoExecucao', width: 15 }
        ]);
    }

    // 4. CADERNO DE TESTES
    if (formData.cadernoTestes?.length > 0) {
        drawSectionTitle('4. Evidências de Testes');
        drawTable(formData.cadernoTestes, [
            { label: 'Cenário de Teste', key: 'nomeTeste', width: 40 },
            { label: 'Tipo', key: 'tipoTeste', width: 25 },
            { label: 'Evidência / Link', key: 'linkTeste', width: 35 }
        ]);
    }

    // 5. CHECKLIST DE GOVERNANÇA
    drawSectionTitle('5. Checklist de Governança');
    doc.setFontSize(9);
    formData.checklist.forEach((item: any) => {
        if (item.answer) {
            const splitQ = doc.splitTextToSize(`• ${item.question}`, contentWidth - 20);
            const blockH = (splitQ.length * 5) + 2;
            checkPageBreak(blockH);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`[${item.answer}]`, margin, y);
            
            doc.setFont('helvetica', 'normal');
            doc.text(splitQ, margin + 18, y);
            y += blockH;
            
            if (item.answer === 'Não' && item.justification) {
                const splitJ = doc.splitTextToSize(`Justificativa: ${item.justification}`, contentWidth - 25);
                checkPageBreak(splitJ.length * 5);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(splitJ, margin + 18, y);
                doc.setTextColor(0, 0, 0);
                y += (splitJ.length * 5) + 2;
            }
        }
    });

    // 6. CONTATOS
    if (formData.contatos?.length > 0) {
        drawSectionTitle('6. Matriz de Contatos');
        drawTable(formData.contatos, [
            { label: 'Nome', key: 'nome', width: 35 },
            { label: 'Cargo / Área', key: 'area', width: 30 },
            { label: 'Contato Principal', key: 'email', width: 35 }
        ]);
    }

    // --- FINALIZAÇÃO ---
    const finalFileName = `${requestId || 'RDM'}_Relatorio_${new Date().getTime()}.pdf`;
    doc.save(finalFileName);

    // Upload (opcional dependendo do backend)
    try {
        const pdfBlob = doc.output('blob');
        const uploadData = new FormData();
        uploadData.append('file', pdfBlob, finalFileName);
        const res = await fetch('http://localhost:3000/reports/upload', { method: 'POST', body: uploadData });
        return { success: res.ok, message: res.ok ? 'Relatório enviado!' : 'Erro no upload.' };
    } catch (e) {
        return { success: false, message: 'PDF gerado com sucesso.' };
    }
};

export const newId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
