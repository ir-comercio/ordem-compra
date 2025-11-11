// ============================================
// GERAÇÃO DE PDF
// ============================================
function generatePDF() {
    const modalNumero = document.getElementById('modalNumero').textContent;
    const ordem = ordens.find(o => o.numeroOrdem === modalNumero);
    
    if (!ordem) {
        showToast('Ordem não encontrada!', 'error');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    let y = 20;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 5;
    const bottomMargin = 40; // Margem inferior para não ultrapassar
    
    // Função para verificar se precisa de nova página
    function checkNewPage(spaceNeeded) {
        if (y + spaceNeeded > pageHeight - bottomMargin) {
            doc.addPage();
            y = 20;
            return true;
        }
        return false;
    }
    
    // ===== CABEÇALHO =====
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(204, 112, 0);
    doc.text('ORDEM DE COMPRA', pageWidth / 2, y, { align: 'center' });
    
    y += 8;
    doc.setFontSize(14);
    doc.text(`Nº ${ordem.numeroOrdem}`, pageWidth / 2, y, { align: 'center' });
    
    y += 12;
    
    // ===== DADOS PARA FATURAMENTO (FIXO) =====
    checkNewPage(30);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS PARA FATURAMENTO', margin, y);
    
    y += lineHeight + 1;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('I.R. COMERCIO E MATERIAIS ELÉTRICOS LTDA', margin, y);
    
    y += lineHeight;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('CNPJ: 33.149.502/0001-38  |  IE: 083.780.74-2', margin, y);
    
    y += lineHeight;
    doc.text('Rua Tadorna nº 472, sala 2', margin, y);
    
    y += lineHeight;
    doc.text('Novo Horizonte - Serra/ES  |  CEP: 29.163-318', margin, y);
    
    y += lineHeight;
    doc.text('Telefax: (27) 3209-4291  |  E-mail: comercial.ircomercio@gmail.com', margin, y);
    
    y += 10;
    
    // ===== DADOS DO FORNECEDOR - TABELA =====
    checkNewPage(65);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO FORNECEDOR', margin, y);
    
    y += 6;
    
    // Desenha tabela do fornecedor
    const tableStartY = y;
    const colWidth = (pageWidth - 2 * margin) / 2;
    const rowHeight = 7;
    
    const fornecedorFields = [
        ['Razão Social', ordem.razaoSocial],
        ['Nome Fantasia', ordem.nomeFantasia || '-'],
        ['CNPJ', ordem.cnpj],
        ['Endereço', ordem.enderecoFornecedor || '-'],
        ['Site', ordem.site || '-'],
        ['Contato', ordem.contato || '-'],
        ['Telefone', ordem.telefone || '-'],
        ['E-mail', ordem.email || '-']
    ];
    
    doc.setFontSize(8);
    
    fornecedorFields.forEach((field, index) => {
        const currentY = tableStartY + (index * rowHeight);
        
        // Desenha borda da célula
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, currentY, colWidth, rowHeight);
        doc.rect(margin + colWidth, currentY, colWidth, rowHeight);
        
        // Label (coluna esquerda)
        doc.setFont(undefined, 'bold');
        doc.text(field[0] + ':', margin + 2, currentY + 4.5);
        
        // Valor (coluna direita)
        doc.setFont(undefined, 'normal');
        const textValue = field[1].length > 45 ? field[1].substring(0, 42) + '...' : field[1];
        doc.text(textValue, margin + colWidth + 2, currentY + 4.5);
    });
    
    y = tableStartY + (fornecedorFields.length * rowHeight) + 8;
    
    // ===== ITENS DO PEDIDO - TABELA =====
    checkNewPage(20);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('ITENS DO PEDIDO', margin, y);
    
    y += 6;
    
    // Configuração da tabela de itens
    const tableWidth = pageWidth - (2 * margin);
    const colWidths = {
        item: tableWidth * 0.06,
        especificacao: tableWidth * 0.44,
        qtd: tableWidth * 0.10,
        unid: tableWidth * 0.10,
        valorUn: tableWidth * 0.15,
        total: tableWidth * 0.15
    };
    
    const itemRowHeight = 10;
    
    // Função para desenhar cabeçalho da tabela
    function drawTableHeader() {
        doc.setFillColor(108, 117, 125);
        doc.setDrawColor(180, 180, 180);
        doc.rect(margin, y, tableWidth, itemRowHeight, 'FD');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        
        let xPos = margin;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('ITEM', xPos + (colWidths.item / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.item;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('ESPECIFICAÇÃO', xPos + (colWidths.especificacao / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.especificacao;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('QTD', xPos + (colWidths.qtd / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.qtd;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('UNID', xPos + (colWidths.unid / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.unid;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('VALOR UN', xPos + (colWidths.valorUn / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.valorUn;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('TOTAL', xPos + (colWidths.total / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.total;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        y += itemRowHeight;
        doc.setTextColor(0, 0, 0);
    }
    
    // Desenha cabeçalho inicial
    drawTableHeader();
    
    // Linhas dos itens
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    ordem.items.forEach((item, index) => {
        // Verifica se precisa de nova página
        if (y + itemRowHeight > pageHeight - bottomMargin) {
            doc.addPage();
            y = 20;
            drawTableHeader();
        }
        
        // Linha zebrada
        if (index % 2 !== 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y, tableWidth, itemRowHeight, 'F');
        }
        
        let xPos = margin;
        
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text(item.item.toString(), xPos + (colWidths.item / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.item;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        const especificacao = item.especificacao.length > 60 
            ? item.especificacao.substring(0, 57) + '...' 
            : item.especificacao;
        doc.text(especificacao, xPos + 3, y + 6.5);
        xPos += colWidths.especificacao;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text(item.quantidade.toString(), xPos + (colWidths.qtd / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.qtd;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text(item.unidade, xPos + (colWidths.unid / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.unid;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        const valorUnFormatted = 'R$ ' + item.valorUnitario.toFixed(2).replace('.', ',');
        doc.text(valorUnFormatted, xPos + (colWidths.valorUn / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.valorUn;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text(item.valorTotal, xPos + (colWidths.total / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.total;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.line(margin, y + itemRowHeight, margin + tableWidth, y + itemRowHeight);
        
        y += itemRowHeight;
    });
    
    y += 8;
    
    // ===== VALOR TOTAL, IPI, ST, FRETE =====
    checkNewPage(30);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Valor Total: ${ordem.valorTotal}`, margin, y);
    
    y += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('IPI: ', margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(ordem.ipi || 'ISENTO', margin + 10, y);
    
    y += 5;
    doc.setFont(undefined, 'bold');
    doc.text('ST: ', margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(ordem.st || 'NÃO INCLUÍDO', margin + 10, y);
    
    y += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Frete: ', margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(ordem.frete, margin + 15, y);
    
    y += 10;
    
    // ===== LOCAL DE ENTREGA =====
    checkNewPage(20);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('LOCAL DE ENTREGA:', margin, y);
    y += 5;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('Rua Tadorna nº 472, sala 2, Novo Horizonte - Serra/ES  |  CEP: 29.163-318', margin, y);
    
    y += 8;
    
    // ===== PRAZO E FRETE =====
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('PRAZO DE ENTREGA:', margin, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(ordem.prazoEntrega, margin + 38, y);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('FRETE:', pageWidth - margin - 35, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(ordem.frete, pageWidth - margin - 20, y);
    
    y += 10;
    
    // ===== DADOS DO PAGAMENTO =====
    checkNewPage(25);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO PAGAMENTO', margin, y);
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Forma de Pagamento: ${ordem.formaPagamento}`, margin, y);
    
    y += 5;
    doc.text(`Prazo de Pagamento: ${ordem.prazoPagamento}`, margin, y);
    
    if (ordem.dadosBancarios) {
        y += 5;
        doc.text(`Dados Bancários: ${ordem.dadosBancarios}`, margin, y);
    }
    
    y += 12;
    
    // ===== DATA E ASSINATURA =====
    checkNewPage(45);
    const dataOrdem = new Date(ordem.dataOrdem + 'T00:00:00');
    const dia = dataOrdem.getDate();
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mes = meses[dataOrdem.getMonth()];
    const ano = dataOrdem.getFullYear();
    
    doc.setFontSize(10);
    doc.text(`Serra/ES, ${dia} de ${mes} de ${ano}`, pageWidth / 2, y, { align: 'center' });
    
    y += 15;
    
    // Adiciona imagem de assinatura
    const assinaturaImg = new Image();
    assinaturaImg.src = 'assinatura.png';
    
    assinaturaImg.onload = function() {
        // Adiciona a imagem centralizada
        const imgWidth = 60;
        const imgHeight = 20;
        const imgX = (pageWidth - imgWidth) / 2;
        
        doc.addImage(assinaturaImg, 'PNG', imgX, y, imgWidth, imgHeight);
        
        y += imgHeight + 5;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Rosemeire Bicalho de Lima Gravino', pageWidth / 2, y, { align: 'center' });
        
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.text('Diretora', pageWidth / 2, y, { align: 'center' });
        
        y += 12;
        
        // ===== ATENÇÃO SR. FORNECEDOR =====
        checkNewPage(20);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(204, 112, 0);
        doc.text('ATENÇÃO SR. FORNECEDOR', pageWidth / 2, y, { align: 'center' });
        
        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(`1. GENTILEZA MENCIONAR NA NOTA FISCAL O Nº ${ordem.numeroOrdem}`, margin, y);
        
        y += 5;
        doc.text('2. FAVOR ENVIAR A NOTA FISCAL ELETRÔNICA (.XML) PARA: FINANCEIRO.IRCOMERCIO@GMAIL.COM', margin, y);
        
        // Salvar PDF
        doc.save(`Ordem_${ordem.numeroOrdem}.pdf`);
        showToast('PDF gerado com sucesso!', 'success');
    };
    
    assinaturaImg.onerror = function() {
        // Se a imagem não carregar, continua sem ela
        y += 5;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Rosemeire Bicalho de Lima Gravino', pageWidth / 2, y, { align: 'center' });
        
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.text('Diretora', pageWidth / 2, y, { align: 'center' });
        
        y += 12;
        
        checkNewPage(20);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(204, 112, 0);
        doc.text('ATENÇÃO SR. FORNECEDOR', pageWidth / 2, y, { align: 'center' });
        
        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(`1. GENTILEZA MENCIONAR NA NOTA FISCAL O Nº ${ordem.numeroOrdem}`, margin, y);
        
        y += 5;
        doc.text('2. FAVOR ENVIAR A NOTA FISCAL ELETRÔNICA (.XML) PARA: FINANCEIRO.IRCOMERCIO@GMAIL.COM', margin, y);
        
        doc.save(`Ordem_${ordem.numeroOrdem}.pdf`);
        showToast('PDF gerado com sucesso!', 'success');
    };
}
