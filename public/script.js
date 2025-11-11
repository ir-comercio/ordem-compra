// ============================================
// GESTÃO DE ITENS
// ============================================
function addItem() {
    itemCounter++;
    const tbody = document.getElementById('itemsBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td style="text-align: center;">${itemCounter}</td>
        <td>
            <textarea class="item-especificacao" placeholder="Descrição do item..." rows="2"></textarea>
        </td>
        <td>
            <input type="number" class="item-qtd" min="0" step="0.01" value="1" onchange="calculateItemTotal(this)">
        </td>
        <td>
            <input type="text" class="item-unid" value="UN" placeholder="UN">
        </td>
        <td>
            <input type="number" class="item-valor" min="0" step="0.01" value="0" onchange="calculateItemTotal(this)">
        </td>
        <td>
            <input type="text" class="item-ipi" placeholder="Ex: Isento" value="Isento">
        </td>
        <td>
            <input type="text" class="item-st" placeholder="Ex: Não incl." value="Não incl.">
        </td>
        <td>
            <input type="text" class="item-total" readonly value="R$ 0,00">
        </td>
        <td class="item-actions">
            <button type="button" class="danger small" onclick="removeItem(this)">Excluir</button>
        </td>
    `;
    tbody.appendChild(row);
}

// ============================================
// SUBMIT DO FORMULÁRIO
// ============================================
function handleSubmit(event) {
    event.preventDefault();
    
    // Coleta os itens
    const items = [];
    const rows = document.querySelectorAll('#itemsBody tr');
    rows.forEach((row, index) => {
        items.push({
            item: index + 1,
            especificacao: row.querySelector('.item-especificacao').value,
            quantidade: parseFloat(row.querySelector('.item-qtd').value) || 0,
            unidade: row.querySelector('.item-unid').value,
            valorUnitario: parseFloat(row.querySelector('.item-valor').value) || 0,
            ipi: row.querySelector('.item-ipi').value || 'Isento',
            st: row.querySelector('.item-st').value || 'Não incl.',
            valorTotal: row.querySelector('.item-total').value
        });
    });
    
    const timestamp = Date.now();
    
    const formData = {
        id: editingId || timestamp.toString(),
        numeroOrdem: document.getElementById('numeroOrdem').value,
        responsavel: document.getElementById('responsavel').value,
        dataOrdem: document.getElementById('dataOrdem').value,
        razaoSocial: document.getElementById('razaoSocial').value,
        nomeFantasia: document.getElementById('nomeFantasia').value,
        cnpj: document.getElementById('cnpj').value,
        enderecoFornecedor: document.getElementById('enderecoFornecedor').value,
        site: document.getElementById('site').value,
        contato: document.getElementById('contato').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        items: items,
        valorTotal: document.getElementById('valorTotalOrdem').value,
        frete: document.getElementById('frete').value,
        localEntrega: document.getElementById('localEntrega').value,
        prazoEntrega: document.getElementById('prazoEntrega').value,
        transporte: document.getElementById('transporte').value,
        formaPagamento: document.getElementById('formaPagamento').value,
        prazoPagamento: document.getElementById('prazoPagamento').value,
        dadosBancarios: document.getElementById('dadosBancarios').value,
        status: 'aberta',
        timestamp: timestamp
    };
    
    if (editingId) {
        const index = ordens.findIndex(o => o.id === editingId);
        formData.timestamp = ordens[index].timestamp;
        ordens[index] = formData;
        showToast('Ordem atualizada com sucesso!', 'success');
    } else {
        ordens.push(formData);
        showToast('Ordem criada com sucesso!', 'success');
    }
    
    saveToLocalStorage();
    updateDisplay();
    closeFormModal();
}

// ============================================
// EDIÇÃO
// ============================================
function editOrdem(id) {
    const ordem = ordens.find(o => o.id === id);
    if (!ordem) return;
    
    editingId = id;
    currentTab = 0;
    document.getElementById('formTitle').textContent = 'Editar Ordem de Compra';
    
    // Preenche campos básicos
    document.getElementById('editId').value = ordem.id;
    document.getElementById('numeroOrdem').value = ordem.numeroOrdem;
    document.getElementById('responsavel').value = ordem.responsavel;
    document.getElementById('dataOrdem').value = ordem.dataOrdem;
    document.getElementById('razaoSocial').value = ordem.razaoSocial;
    document.getElementById('nomeFantasia').value = ordem.nomeFantasia || '';
    document.getElementById('cnpj').value = ordem.cnpj;
    document.getElementById('enderecoFornecedor').value = ordem.enderecoFornecedor || '';
    document.getElementById('site').value = ordem.site || '';
    document.getElementById('contato').value = ordem.contato || '';
    document.getElementById('telefone').value = ordem.telefone || '';
    document.getElementById('email').value = ordem.email || '';
    document.getElementById('frete').value = ordem.frete || '';
    document.getElementById('localEntrega').value = ordem.localEntrega || '';
    document.getElementById('prazoEntrega').value = ordem.prazoEntrega || '';
    document.getElementById('transporte').value = ordem.transporte || '';
    document.getElementById('formaPagamento').value = ordem.formaPagamento;
    document.getElementById('prazoPagamento').value = ordem.prazoPagamento;
    document.getElementById('dadosBancarios').value = ordem.dadosBancarios || '';
    
    // Preenche itens
    document.getElementById('itemsBody').innerHTML = '';
    itemCounter = 0;
    ordem.items.forEach(item => {
        addItem();
        const row = document.querySelector('#itemsBody tr:last-child');
        row.querySelector('.item-especificacao').value = item.especificacao;
        row.querySelector('.item-qtd').value = item.quantidade;
        row.querySelector('.item-unid').value = item.unidade;
        row.querySelector('.item-valor').value = item.valorUnitario;
        row.querySelector('.item-ipi').value = item.ipi || 'Isento';
        row.querySelector('.item-st').value = item.st || 'Não incl.';
        row.querySelector('.item-total').value = item.valorTotal;
    });
    
    recalculateOrderTotal();
    
    // Reseta para a primeira aba
    showTab(0);
    
    document.getElementById('formModal').classList.add('show');
}

// ============================================
// VISUALIZAÇÃO
// ============================================
function viewOrdem(id) {
    const ordem = ordens.find(o => o.id === id);
    if (!ordem) return;
    
    document.getElementById('modalNumero').textContent = ordem.numeroOrdem;
    
    // Tab: Geral
    document.getElementById('info-tab-geral').innerHTML = `
        <div class="info-section">
            <h4>Informações Gerais</h4>
            <p><strong>Responsável:</strong> ${ordem.responsavel}</p>
            <p><strong>Data:</strong> ${formatDate(ordem.dataOrdem)}</p>
            <p><strong>Status:</strong> <span class="badge ${ordem.status}">${ordem.status.toUpperCase()}</span></p>
        </div>
    `;
    
    // Tab: Fornecedor
    document.getElementById('info-tab-fornecedor').innerHTML = `
        <div class="info-section">
            <h4>Dados do Fornecedor</h4>
            <p><strong>Razão Social:</strong> ${ordem.razaoSocial}</p>
            ${ordem.nomeFantasia ? `<p><strong>Nome Fantasia:</strong> ${ordem.nomeFantasia}</p>` : ''}
            <p><strong>CNPJ:</strong> ${ordem.cnpj}</p>
            ${ordem.enderecoFornecedor ? `<p><strong>Endereço:</strong> ${ordem.enderecoFornecedor}</p>` : ''}
            ${ordem.site ? `<p><strong>Site:</strong> ${ordem.site}</p>` : ''}
            ${ordem.contato ? `<p><strong>Contato:</strong> ${ordem.contato}</p>` : ''}
            ${ordem.telefone ? `<p><strong>Telefone:</strong> ${ordem.telefone}</p>` : ''}
            ${ordem.email ? `<p><strong>E-mail:</strong> ${ordem.email}</p>` : ''}
        </div>
    `;
    
    // Tab: Pedido
    document.getElementById('info-tab-pedido').innerHTML = `
        <div class="info-section">
            <h4>Itens do Pedido</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; margin-top: 0.5rem;">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Especificação</th>
                            <th>QTD</th>
                            <th>Unid</th>
                            <th>Valor UN</th>
                            <th>IPI</th>
                            <th>ST</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordem.items.map(item => `
                            <tr>
                                <td>${item.item}</td>
                                <td>${item.especificacao}</td>
                                <td>${item.quantidade}</td>
                                <td>${item.unidade}</td>
                                <td>R$ ${item.valorUnitario.toFixed(2)}</td>
                                <td>${item.ipi || 'Isento'}</td>
                                <td>${item.st || 'Não incl.'}</td>
                                <td>${item.valorTotal}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p style="margin-top: 1rem; font-size: 1.1rem;"><strong>Valor Total:</strong> ${ordem.valorTotal}</p>
            ${ordem.frete ? `<p><strong>Frete:</strong> ${ordem.frete}</p>` : ''}
        </div>
    `;
    
    // Tab: Entrega
    document.getElementById('info-tab-entrega').innerHTML = `
        <div class="info-section">
            <h4>Informações de Entrega</h4>
            ${ordem.localEntrega ? `<p><strong>Local de Entrega:</strong> ${ordem.localEntrega}</p>` : ''}
            ${ordem.prazoEntrega ? `<p><strong>Prazo de Entrega:</strong> ${ordem.prazoEntrega}</p>` : ''}
            ${ordem.transporte ? `<p><strong>Transporte:</strong> ${ordem.transporte}</p>` : ''}
        </div>
    `;
    
    // Tab: Pagamento
    document.getElementById('info-tab-pagamento').innerHTML = `
        <div class="info-section">
            <h4>Dados de Pagamento</h4>
            <p><strong>Forma de Pagamento:</strong> ${ordem.formaPagamento}</p>
            <p><strong>Prazo de Pagamento:</strong> ${ordem.prazoPagamento}</p>
            ${ordem.dadosBancarios ? `<p><strong>Dados Bancários:</strong> ${ordem.dadosBancarios}</p>` : ''}
        </div>
    `;
    
    // Reseta para a primeira aba
    document.querySelectorAll('#infoModal .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#infoModal .tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('#infoModal .tab-btn')[0].classList.add('active');
    document.getElementById('info-tab-geral').classList.add('active');
    
    document.getElementById('infoModal').classList.add('show');
}
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
    const bottomMargin = 40;
    
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
        
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, currentY, colWidth, rowHeight);
        doc.rect(margin + colWidth, currentY, colWidth, rowHeight);
        
        doc.setFont(undefined, 'bold');
        doc.text(field[0] + ':', margin + 2, currentY + 4.5);
        
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
    
    const tableWidth = pageWidth - (2 * margin);
    const colWidths = {
        item: tableWidth * 0.05,           // 5%
        especificacao: tableWidth * 0.35,  // 35%
        qtd: tableWidth * 0.08,            // 8%
        unid: tableWidth * 0.08,           // 8%
        valorUn: tableWidth * 0.13,        // 13%
        ipi: tableWidth * 0.10,            // 10%
        st: tableWidth * 0.10,             // 10%
        total: tableWidth * 0.11           // 11%
    };
    
    const itemRowHeight = 10;
    
    // Função para desenhar cabeçalho da tabela
    function drawTableHeader() {
        doc.setFillColor(108, 117, 125);
        doc.setDrawColor(180, 180, 180);
        doc.rect(margin, y, tableWidth, itemRowHeight, 'FD');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
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
        
        doc.text('IPI', xPos + (colWidths.ipi / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.ipi;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('ST', xPos + (colWidths.st / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.st;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text('TOTAL', xPos + (colWidths.total / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.total;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        y += itemRowHeight;
        doc.setTextColor(0, 0, 0);
    }
    
    drawTableHeader();
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    ordem.items.forEach((item, index) => {
        if (y + itemRowHeight > pageHeight - bottomMargin) {
            doc.addPage();
            y = 20;
            drawTableHeader();
        }
        
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
        
        const especificacao = item.especificacao.length > 50 
            ? item.especificacao.substring(0, 47) + '...' 
            : item.especificacao;
        doc.text(especificacao, xPos + 2, y + 6.5);
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
        
        const ipiText = item.ipi || 'Isento';
        const ipiShort = ipiText.length > 10 ? ipiText.substring(0, 8) + '...' : ipiText;
        doc.text(ipiShort, xPos + (colWidths.ipi / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.ipi;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        const stText = item.st || 'Não incl.';
        const stShort = stText.length > 10 ? stText.substring(0, 8) + '...' : stText;
        doc.text(stShort, xPos + (colWidths.st / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.st;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.text(item.valorTotal, xPos + (colWidths.total / 2), y + 6.5, { align: 'center' });
        xPos += colWidths.total;
        doc.line(xPos, y, xPos, y + itemRowHeight);
        
        doc.line(margin, y + itemRowHeight, margin + tableWidth, y + itemRowHeight);
        
        y += itemRowHeight;
    });
    
    y += 8;
    
    // ===== VALOR TOTAL E FRETE =====
    checkNewPage(20);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Valor Total: ${ordem.valorTotal}`, margin, y);
    
    y += 6;
    doc.setFontSize(10);
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
