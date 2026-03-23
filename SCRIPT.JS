// =============================
// INICIALIZAÇÃO
// =============================
document.addEventListener("DOMContentLoaded", () => {
    const btnCalcular = document.getElementById("btnCalcular");
    const tabPreco = document.getElementById("tabPreco");
    const tabMargem = document.getElementById("tabMargem");
    const tabComparador = document.getElementById("tabComparador");
    const tabMultiplos = document.getElementById("tabMultiplos");
    const btnAdicionarProduto = document.getElementById("btnAdicionarProduto");
    const presetBtns = document.querySelectorAll(".preset-btn");

    btnCalcular.addEventListener("click", calcular);
    tabPreco.addEventListener("click", () => mudarModo("preco"));
    tabMargem.addEventListener("click", () => mudarModo("margem"));
    
    // Abas Comparador e Múltiplos
    if (tabComparador) {
        tabComparador.addEventListener("click", () => mudarModoComparador("comparador"));
    }
    if (tabMultiplos) {
        tabMultiplos.addEventListener("click", () => mudarModoComparador("multiplos"));
    }
    
    // Botão Adicionar Produto
    if (btnAdicionarProduto) {
        btnAdicionarProduto.addEventListener("click", () => adicionarLinhaTabela());
    }

    // Botões de margem pré-definida
    presetBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("margem").value = btn.dataset.valor;
            calcular();
        });
    });

    renderizarHistorico();
});

let modoAtual = "preco";


function mudarModo(modo) {
    modoAtual = modo;

    const modoPreco = document.getElementById("modoPreco");
    const modoMargem = document.getElementById("modoMargem");
    const tabPreco = document.getElementById("tabPreco");
    const tabMargem = document.getElementById("tabMargem");
    const btnCalcular = document.getElementById("btnCalcular");
    const resultadoLabel = document.getElementById("resultadoLabel");

    if (modo === "preco") {
        modoPreco.classList.add("modo-ativo");
        modoPreco.classList.remove("modo-inativo");
        modoMargem.classList.remove("modo-ativo");
        modoMargem.classList.add("modo-inativo");

        tabPreco.classList.add("active");
        tabMargem.classList.remove("active");

        btnCalcular.innerText = "Calcular Preço";
        resultadoLabel.innerText = "Preço de Venda";
    } else {
        modoPreco.classList.remove("modo-ativo");
        modoPreco.classList.add("modo-inativo");
        modoMargem.classList.add("modo-ativo");
        modoMargem.classList.remove("modo-inativo");

        tabPreco.classList.remove("active");
        tabMargem.classList.add("active");

        btnCalcular.innerText = "Calcular Margem";
        resultadoLabel.innerText = "Margem Real";
    }


    document.getElementById("resultado").innerText = "R$ 0,00";
    document.getElementById("detalhes").innerText = "";
    document.getElementById("viabilidade").textContent = "";
    document.getElementById("breakdown").style.display = "none";
}


function calcular() {
    if (modoAtual === "preco") {
        calcularPreco();
    } else {
        calcularMargem();
    }
}


function calcularPreco() {
    let custo = parseFloat(document.getElementById("custo").value) || 0;
    let frete = parseFloat(document.getElementById("frete").value) || 0;
    let taxa = (parseFloat(document.getElementById("taxa").value) || 0) / 100;
    let imposto = (parseFloat(document.getElementById("imposto").value) || 0) / 100;
    let margem = (parseFloat(document.getElementById("margem").value) || 0) / 100;

    let resultadoEl = document.getElementById("resultado");
    let detalhesEl = document.getElementById("detalhes");
    let viabilidadeEl = document.getElementById("viabilidade");
    let breakdownEl = document.getElementById("breakdown");

    if ((taxa + imposto + margem) >= 1) {
        resultadoEl.innerText = "❌ Inválido";
        detalhesEl.innerText = "Taxas + margem não podem ultrapassar 100%";
        detalhesEl.className = "detalhes prejuizo";
        viabilidadeEl.textContent = "";
        breakdownEl.style.display = "none";
        return;
    }

    let preco = (custo + frete) / (1 - taxa - imposto - margem);

    if (preco <= 0 || !isFinite(preco)) {
        resultadoEl.innerText = "❌ Inválido";
        detalhesEl.innerText = "Verifique os valores digitados";
        detalhesEl.className = "detalhes prejuizo";
        viabilidadeEl.textContent = "";
        breakdownEl.style.display = "none";
        return;
    }

    animarNumero(preco);
    vibrar();

    let taxasAbsoluto = preco * taxa;
    let impostosAbsoluto = preco * imposto;
    let lucroValor = preco - custo - frete - taxasAbsoluto - impostosAbsoluto;
    let margemReal = (lucroValor / preco) * 100;

    detalhesEl.innerText = `Lucro: R$ ${lucroValor.toFixed(2)} • Margem: ${margemReal.toFixed(1)}%`;
    

    let classe = "viavel";
    let mensagem = "✅ Margem Excelente";
    
    if (margemReal < 10) {
        classe = "prejuizo";
        mensagem = "❌ Margem Insuficiente";
    } else if (margemReal < 15) {
        classe = "atencao";
        mensagem = "⚠️ Margem Apertada";
    }
    
    viabilidadeEl.className = `badge-viabilidade ${classe}`;
    viabilidadeEl.textContent = mensagem;
    detalhesEl.className = `detalhes ${classe}`;

    exibirBreakdown(custo, frete, taxasAbsoluto, impostosAbsoluto, lucroValor, preco);

    verificarMargemMinima();

    salvarHistoricoComNome({
        tipo: "PREÇO",
        valor: preco,
        margem: (margem * 100).toFixed(1)
    });
}


function exibirBreakdown(custo, frete, taxa, imposto, lucro, precoTotal) {
    let breakdownEl = document.getElementById("breakdown");
    breakdownEl.style.display = "block";

    // Calcular percentuais para as barras
    let custoPercent = (custo / precoTotal) * 100;
    let fretePercent = (frete / precoTotal) * 100;
    let taxaPercent = (taxa / precoTotal) * 100;
    let impostoPercent = (imposto / precoTotal) * 100;
    let lucroPercent = (lucro / precoTotal) * 100;

    // Atualizar barras
    document.getElementById("bar-custo").style.width = custoPercent + "%";
    document.getElementById("bar-frete").style.width = fretePercent + "%";
    document.getElementById("bar-taxa").style.width = taxaPercent + "%";
    document.getElementById("bar-imposto").style.width = impostoPercent + "%";
    document.getElementById("bar-lucro").style.width = lucroPercent + "%";

    // Atualizar valores
    document.getElementById("valor-custo").textContent = "R$ " + custo.toFixed(2);
    document.getElementById("valor-frete").textContent = "R$ " + frete.toFixed(2);
    document.getElementById("valor-taxa").textContent = "R$ " + taxa.toFixed(2);
    document.getElementById("valor-imposto").textContent = "R$ " + imposto.toFixed(2);
    document.getElementById("valor-lucro").textContent = "R$ " + lucro.toFixed(2);
}

// =============================
// MODO 2: CALCULAR MARGEM
// =============================
function calcularMargem() {
    let custo = parseFloat(document.getElementById("custoRev").value) || 0;
    let frete = parseFloat(document.getElementById("freteRev").value) || 0;
    let taxa = (parseFloat(document.getElementById("taxaRev").value) || 0) / 100;
    let imposto = (parseFloat(document.getElementById("impostoRev").value) || 0) / 100;
    let precoVenda = parseFloat(document.getElementById("precoVenda").value) || 0;

    let resultadoEl = document.getElementById("resultado");
    let detalhesEl = document.getElementById("detalhes");

    if (precoVenda <= 0) {
        resultadoEl.innerText = "❌ Inválido";
        detalhesEl.innerText = "Digite um preço de venda válido";
        detalhesEl.className = "detalhes prejuizo";
        return;
    }

    // Cálculo da margem real
    let custoTotal = custo + frete;
    let taxasAbsoluto = precoVenda * taxa;
    let impostosAbsoluto = precoVenda * imposto;
    let lucro = precoVenda - custoTotal - taxasAbsoluto - impostosAbsoluto;
    let margemReal = (lucro / precoVenda) * 100;

    animarNumero(margemReal);
    vibrar();

    // Status
    let status = "✅ Viável";
    let classe = "viavel";

    if (margemReal < 5) {
        status = "⚠️ Margem muito baixa";
        classe = "prejuizo";
    } else if (margemReal < 10) {
        status = "⚠️ Margem apertada";
        classe = "atencao";
    } else if (margemReal < 0) {
        status = "❌ Prejudicial";
        classe = "prejuizo";
    }

    detalhesEl.innerText = `${status} • Lucro: R$ ${lucro.toFixed(2)}`;
    detalhesEl.className = `detalhes ${classe}`;

    // Para exibir como porcentagem
    resultadoEl.innerText = `${margemReal.toFixed(1)}%`;

    // Verificar margem mínima
    verificarMargemMinima();

    salvarHistoricoComNome({
        tipo: "MARGEM",
        valor: margemReal.toFixed(1),
        precoVenda: precoVenda
    });
}

// =============================
// ANIMAÇÃO DE NÚMERO
// =============================
function animarNumero(valorFinal) {
    let el = document.getElementById("resultado");
    let inicio = 0;
    let duracao = 600;
    let start = null;
    let isPercentage = modoAtual === "margem";

    function frame(t) {
        if (!start) start = t;
        let progress = Math.min((t - start) / duracao, 1);
        let valor = inicio + (valorFinal - inicio) * progress;

        if (isPercentage) {
            el.innerText = `${valor.toFixed(1)}%`;
        } else {
            el.innerText = "R$ " + valor.toFixed(2);
        }

        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

// =============================
// VIBRAÇÃO
// =============================
function vibrar() {
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// =============================
// HISTÓRICO
// =============================
function salvarHistorico(dados) {
    let historico = JSON.parse(localStorage.getItem("historico")) || [];
    historico.unshift(dados);
    localStorage.setItem("historico", JSON.stringify(historico));
    renderizarHistorico();
}

function renderizarHistorico() {
    let lista = document.getElementById("listaHistorico");
    if (!lista) return;

    let historico = JSON.parse(localStorage.getItem("historico")) || [];
    lista.innerHTML = "";

    historico.slice(0, 5).forEach(item => {
        let div = document.createElement("div");
        div.className = "item-historico";

        if (item.tipo === "PREÇO") {
            div.innerText = `💰 R$ ${item.valor.toFixed(2)} (Margem: ${item.margem}%)`;
        } else {
            div.innerText = `📊 ${item.valor}% (Preço: R$ ${item.precoVenda.toFixed(2)})`;
        }

        lista.appendChild(div);
    });
}

// ====================== NOVOS RECURSOS ======================

// 1. TOGGLE TEMA ESCURO
const toggleDarkMode = document.getElementById("toggleDarkMode");
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    toggleDarkMode.textContent = "☀️";
}

toggleDarkMode.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    toggleDarkMode.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// 2. BOTÃO LIMPAR
document.getElementById("btnLimpar").addEventListener("click", () => {
    document.getElementById("modoPreco").reset();
    document.getElementById("modoMargem").reset();
    document.getElementById("resultado").innerText = "R$ 0,00";
    document.getElementById("resultado").className = "resultado";
    document.getElementById("detalhes").innerText = "";
    document.getElementById("viabilidade").innerHTML = "";
    const breakdown = document.getElementById("breakdown");
    if (breakdown) breakdown.style.display = "none";
    const chart = window.priceChart;
    if (chart) chart.destroy();
    window.priceChart = null;
});

// 3. COPIAR PARA CLIPBOARD
document.getElementById("btnCopiar").addEventListener("click", async () => {
    const resultado = document.getElementById("resultado").innerText;
    try {
        await navigator.clipboard.writeText(resultado);
        const btn = document.getElementById("btnCopiar");
        btn.classList.add("copiado");
        btn.textContent = "✓";
        setTimeout(() => {
            btn.classList.remove("copiado");
            btn.textContent = "📋";
        }, 2000);
    } catch (err) {
        alert("Erro ao copiar: " + err);
    }
});

// 5. PRESETS PERSONALIZADOS
const presetsModal = document.getElementById("presetsModal");
const editPresetsBtn = document.querySelector(".preset-edit-btn");
const modalClose = document.querySelector(".modal-close");
const btnSavePresets = document.querySelector(".btn-save-presets");

const presetBtnsList = document.querySelectorAll(".preset-btn");

function carregarPresetsPersonalizados() {
    const presetsData = JSON.parse(localStorage.getItem("presetsPersonalizados")) || {
        preset1: 15,
        preset2: 20,
        preset3: 30
    };
    
    const inputs = {
        preset1: document.getElementById("preset1"),
        preset2: document.getElementById("preset2"),
        preset3: document.getElementById("preset3")
    };
    
    Object.keys(presetsData).forEach(key => {
        if (inputs[key]) inputs[key].value = presetsData[key];
    });
    
    atualizarBotoesPreset(presetsData);
}

function atualizarBotoesPreset(presets) {
    presetBtnsList.forEach((btn, index) => {
        const key = `preset${index + 1}`;
        btn.textContent = `${presets[key]}%`;
        btn.dataset.valor = presets[key];
    });
}

editPresetsBtn.addEventListener("click", () => {
    carregarPresetsPersonalizados();
    presetsModal.style.display = "flex";
});

modalClose.addEventListener("click", () => {
    presetsModal.style.display = "none";
});

presetsModal.addEventListener("click", (e) => {
    if (e.target === presetsModal) {
        presetsModal.style.display = "none";
    }
});

btnSavePresets.addEventListener("click", () => {
    const presetsData = {
        preset1: parseFloat(document.getElementById("preset1").value) || 15,
        preset2: parseFloat(document.getElementById("preset2").value) || 20,
        preset3: parseFloat(document.getElementById("preset3").value) || 30
    };
    
    localStorage.setItem("presetsPersonalizados", JSON.stringify(presetsData));
    atualizarBotoesPreset(presetsData);
    alert("Presets atualizados com sucesso!");
    presetsModal.style.display = "none";
});

// 6. GRÁFICO COM CHART.JS
function atualizarGrafico(custo, frete, taxa, imposto, lucro, preco) {
    const ctx = document.getElementById("priceChart");
    if (!ctx) return;
    
    const ctxContext = ctx.getContext("2d");
    
    // Limpar gráfico anterior
    if (window.priceChart) {
        window.priceChart.destroy();
    }
    
    // Arredondar valores para visualização
    const custoArred = parseFloat(custo) || 0;
    const freteArred = parseFloat(frete) || 0;
    const taxaValor = (custoArred * (parseFloat(taxa) || 0)) / 100;
    const impostoValor = (custoArred * (parseFloat(imposto) || 0)) / 100;
    const lucroArred = parseFloat(lucro) || 0;
    
    window.priceChart = new Chart(ctxContext, {
        type: "doughnut",
        data: {
            labels: ["Custo", "Frete", "Taxa", "Imposto", "Lucro"],
            datasets: [{
                data: [custoArred, freteArred, taxaValor, impostoValor, lucroArred],
                backgroundColor: [
                    "#e74c3c",
                    "#3498db",
                    "#f39c12",
                    "#e67e22",
                    "#2ecc71"
                ],
                borderColor: "#fff",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { family: "'Poppins', sans-serif" },
                        padding: 15,
                        color: document.body.classList.contains("dark-mode") ? "#eceff1" : "#333"
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed;
                            return `R$ ${value.toFixed(2).replace(".", ",")}`;
                        }
                    }
                }
            }
        }
    });
}

// Integrar gráfico nas funções de cálculo existentes
const calcularPrecoOriginal = calcularPreco;
window.calcularPreco = function() {
    calcularPrecoOriginal.call(this);
    
    let custo = parseFloat(document.getElementById("custo").value) || 0;
    let frete = parseFloat(document.getElementById("frete").value) || 0;
    let taxa = parseFloat(document.getElementById("taxa").value) || 0;
    let imposto = parseFloat(document.getElementById("imposto").value) || 0;
    let margem = (parseFloat(document.getElementById("margem").value) || 0) / 100;

    let preco = (custo + frete) / (1 - taxa/100 - imposto/100 - margem);
    
    if (preco > 0 && isFinite(preco)) {
        let taxasAbsoluto = preco * (taxa / 100);
        let impostosAbsoluto = preco * (imposto / 100);
        let lucroValor = preco - custo - frete - taxasAbsoluto - impostosAbsoluto;
        
        atualizarGrafico(custo, frete, taxa, imposto, lucroValor, preco);
    }
};

// 7. ATALHOS DE TECLADO
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        document.getElementById("btnCalcular").click();
    }
    if (e.key === "Escape") {
        document.getElementById("btnLimpar").click();
    }
});

// INICIALIZAR PRESETS AO CARREGAR
carregarPresetsPersonalizados();

// ====================== NOVOS RECURSOS ======================

// 8. HISTÓRICO COM NOME OPCIONAL
function salvarHistoricoComNome(dados) {
    let historico = JSON.parse(localStorage.getItem("historico")) || [];
    const nomeProduto = document.getElementById("nomeProduto").value || "Sem nome";
    
    const item = {
        ...dados,
        nome: nomeProduto,
        data: new Date().toLocaleString()
    };
    
    historico.unshift(item);
    localStorage.setItem("historico", JSON.stringify(historico));
    renderizarHistorico();
    document.getElementById("nomeProduto").value = "";
}

function renderizarHistoricoAtualizado() {
    let lista = document.getElementById("listaHistorico");
    if (!lista) return;

    let historico = JSON.parse(localStorage.getItem("historico")) || [];
    const filtro = document.getElementById("filtroHistorico")?.value.toLowerCase() || "";
    
    lista.innerHTML = "";

    const filtrado = historico.filter(item => 
        item.nome.toLowerCase().includes(filtro)
    );

    filtrado.slice(0, 10).forEach((item, index) => {
        let div = document.createElement("div");
        div.className = "item-historico";

        if (item.tipo === "PREÇO") {
            div.innerHTML = `
                <div>
                    <strong>${item.nome}</strong> - 💰 R$ ${item.valor.toFixed(2)}
                    <br><small>${item.data}</small>
                </div>
                <button class="btn-remover-item" data-index="${historico.indexOf(item)}">✕</button>
            `;
        } else {
            div.innerHTML = `
                <div>
                    <strong>${item.nome}</strong> - 📊 ${item.valor}%
                    <br><small>${item.data}</small>
                </div>
                <button class="btn-remover-item" data-index="${historico.indexOf(item)}">✕</button>
            `;
        }

        lista.appendChild(div);
    });

    // Adicionar event listeners para remover itens
    document.querySelectorAll(".btn-remover-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.index);
            historico.splice(index, 1);
            localStorage.setItem("historico", JSON.stringify(historico));
            renderizarHistoricoAtualizado();
        });
    });
}

// Filtro de histórico
const filtroHistorico = document.getElementById("filtroHistorico");
if (filtroHistorico) {
    filtroHistorico.addEventListener("input", renderizarHistoricoAtualizado);
}

// Limpar todo histórico
const btnLimparHistorico = document.getElementById("btnLimparHistorico");
if (btnLimparHistorico) {
    btnLimparHistorico.addEventListener("click", () => {
        if (confirm("Limpar todo o histórico?")) {
            localStorage.removeItem("historico");
            renderizarHistoricoAtualizado();
        }
    });
}

// 9. ALERTA DE MARGEM MÍNIMA
const margemMinimaInput = document.getElementById("margem-minima");
if (margemMinimaInput) {
    margemMinimaInput.addEventListener("input", () => {
        const resultado = document.getElementById("resultado").innerText;
        if (resultado !== "R$ 0,00") {
            verificarMargemMinima();
        }
    });
}

function verificarMargemMinima() {
    const margemMinima = parseFloat(document.getElementById("margem-minima").value) || 0;
    const detalhes = document.getElementById("detalhes").innerText;
    
    const margemMatch = detalhes.match(/Margem: ([\d.]+)%/);
    if (!margemMatch) return;
    
    const margemReal = parseFloat(margemMatch[1]);
    const alertaDiv = document.getElementById("alerta-margem");
    
    if (margemMinima > 0) {
        alertaDiv.style.display = "block";
        if (margemReal < margemMinima) {
            alertaDiv.className = "alerta-margem aviso";
            alertaDiv.textContent = `⚠️ Margem abaixo do mínimo! (${margemReal.toFixed(1)}% < ${margemMinima}%)`;
        } else {
            alertaDiv.className = "alerta-margem ok";
            alertaDiv.textContent = `✅ Margem acima do mínimo (${margemReal.toFixed(1)}% ≥ ${margemMinima}%)`;
        }
    }
}

// 10. EXPORTAR RESULTADO
document.getElementById("btnExportarPNG")?.addEventListener("click", async () => {
    const container = document.querySelector(".resultado-container");
    const canvas = await html2canvas(container, { backgroundColor: "#fff" });
    const link = document.createElement("a");
    link.href = canvas.toDataURL();
    link.download = `calculo_${new Date().getTime()}.png`;
    link.click();
});

document.getElementById("btnExportarCSV")?.addEventListener("click", () => {
    let csv = "";
    let modoAtualVar = document.querySelector(".tab-btn.active")?.id || "tabPreco";
    
    if (modoAtualVar === "tabMultiplos") {
        // Exportar dados do modo Múltiplos
        csv = "Nome,Custo,Frete,Taxa %,Imposto %,Margem %,Preço Final,Lucro,Margem Real %\n";
        
        document.querySelectorAll(".tabela-row").forEach(row => {
            const nome = row.querySelector(".col-nome").value || "Sem nome";
            const custo = row.querySelector(".col-custo").value || "0";
            const frete = row.querySelector(".col-frete").value || "0";
            const taxa = row.querySelector(".col-taxa").value || "0";
            const imposto = row.querySelector(".col-imposto").value || "0";
            const margem = row.querySelector(".col-margem").value || "0";
            const preco = row.querySelector(".col-preco").textContent || "-";
            const lucro = row.querySelector(".col-lucro").textContent || "-";
            const margemReal = row.querySelector(".col-margem-real").textContent || "-";
            
            csv += `"${nome}","${custo}","${frete}","${taxa}","${imposto}","${margem}","${preco}","${lucro}","${margemReal}"\n`;
        });
        
        // Adicionar resumo
        csv += "\n\nRESUMO\n";
        csv += `Total de Produtos,${document.getElementById("totalProdutos").textContent}\n`;
        csv += `Lucro Total,${document.getElementById("lucroTotal").textContent}\n`;
        csv += `Margem Média,${document.getElementById("margemMedia").textContent}\n`;
    } else {
        // Exportar histórico original
        const historico = JSON.parse(localStorage.getItem("historico")) || [];
        csv = "Nome,Tipo,Valor,Data\n";
        historico.forEach(item => {
            csv += `"${item.nome}","${item.tipo}","${item.valor}","${item.data}"\n`;
        });
    }
    
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = `exportacao_${new Date().getTime()}.csv`;
    link.click();
});

document.getElementById("btnExportarPDF")?.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    const resultado = document.getElementById("resultado").innerText;
    const detalhes = document.getElementById("detalhes").innerText;
    
    pdf.text("Cálculo de Precificação - ML", 10, 10);
    pdf.text(`Resultado: ${resultado}`, 10, 20);
    pdf.text(`Detalhes: ${detalhes}`, 10, 30);
    pdf.text(`Data: ${new Date().toLocaleString()}`, 10, 40);
    
    pdf.save(`calculo_${new Date().getTime()}.pdf`);
});

// 11. MODO COMPARADOR
function mudarModoComparador(modo) {
    const modoPreco = document.getElementById("modoPreco");
    const modoMargem = document.getElementById("modoMargem");
    const modoComparador = document.getElementById("modoComparador");
    const modoMultiplos = document.getElementById("modoMultiplos");
    
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    
    // Remove todas as classes modo-ativo/modo-inativo
    modoPreco.classList.remove("modo-ativo");
    modoMargem.classList.remove("modo-ativo");
    modoComparador.classList.remove("modo-ativo");
    modoMultiplos.classList.remove("modo-ativo");
    
    modoPreco.classList.add("modo-inativo");
    modoMargem.classList.add("modo-inativo");
    modoComparador.classList.add("modo-inativo");
    modoMultiplos.classList.add("modo-inativo");
    
    if (modo === "comparador") {
        document.getElementById("tabComparador").classList.add("active");
        modoComparador.classList.remove("modo-inativo");
        modoComparador.classList.add("modo-ativo");
        document.getElementById("resultado").style.display = "none";
        document.getElementById("viabilidade").style.display = "none";
        document.getElementById("detalhes").style.display = "none";
        document.getElementById("breakdown").style.display = "none";
        document.getElementById("chartContainer").style.display = "none";
        document.getElementById("btnCalcular").style.display = "none";
        document.getElementById("btnLimpar").style.display = "none";
    } else if (modo === "multiplos") {
        document.getElementById("tabMultiplos").classList.add("active");
        modoMultiplos.classList.remove("modo-inativo");
        modoMultiplos.classList.add("modo-ativo");
        document.getElementById("resultado").style.display = "none";
        document.getElementById("viabilidade").style.display = "none";
        document.getElementById("detalhes").style.display = "none";
        document.getElementById("breakdown").style.display = "none";
        document.getElementById("chartContainer").style.display = "none";
        document.getElementById("btnCalcular").style.display = "none";
        document.getElementById("btnLimpar").style.display = "none";
    } else {
        document.getElementById("tabPreco").classList.add("active");
        modoPreco.classList.remove("modo-inativo");
        modoPreco.classList.add("modo-ativo");
        document.getElementById("resultado").style.display = "block";
        document.getElementById("viabilidade").style.display = "block";
        document.getElementById("detalhes").style.display = "block";
        document.getElementById("btnCalcular").style.display = "block";
        document.getElementById("btnLimpar").style.display = "block";
    }
}

// Botões de comparador
document.querySelectorAll(".btn-comparar").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const item = e.target.closest(".comparador-item");
        const nome = item.querySelector(".comp-nome").value || "Produto";
        const custo = parseFloat(item.querySelector(".comp-custo").value) || 0;
        const frete = parseFloat(item.querySelector(".comp-frete").value) || 0;
        const taxa = (parseFloat(item.querySelector(".comp-taxa").value) || 0) / 100;
        const imposto = (parseFloat(item.querySelector(".comp-imposto").value) || 0) / 100;
        const margem = (parseFloat(item.querySelector(".comp-margem").value) || 0) / 100;
        
        const preco = (custo + frete) / (1 - taxa - imposto - margem);
        const lucro = preco - custo - frete - (preco * taxa) - (preco * imposto);
        const margemReal = (lucro / preco) * 100;
        
        const resultado = item.querySelector(".comp-resultado");
        resultado.innerHTML = `R$ ${preco.toFixed(2)}<br><small>Lucro: R$ ${lucro.toFixed(2)}</small><br><small>Margem: ${margemReal.toFixed(1)}%</small>`;
    });
});

// 12. MODO MÚLTIPLOS PRODUTOS
let produtosMultiplos = [];

function adicionarLinhaTabela(dados = {}) {
    const tabelaProdutos = document.getElementById("tabelaProdutos");
    const id = Date.now();
    
    const row = document.createElement("div");
    row.className = "tabela-row";
    row.dataset.id = id;
    
    row.innerHTML = `
        <input type="text" placeholder="Nome" class="col-nome" value="${dados.nome || ''}">
        <input type="number" placeholder="0" class="col-custo" step="1" value="${dados.custo || ''}">
        <input type="number" placeholder="0" class="col-frete" step="1" value="${dados.frete || ''}">
        <input type="number" placeholder="0" class="col-taxa" step="1" value="${dados.taxa || ''}">
        <input type="number" placeholder="0" class="col-imposto" step="1" value="${dados.imposto || ''}">
        <input type="number" placeholder="0" class="col-margem" step="1" value="${dados.margem || ''}">
        <div class="col-preco">-</div>
        <div class="col-lucro">-</div>
        <div class="col-margem-real">-</div>
        <button type="button" class="btn-remover" data-id="${id}">Remover</button>
    `;
    
    tabelaProdutos.appendChild(row);
    
    // Atualizar preço em tempo real
    row.querySelectorAll("input").forEach(input => {
        input.addEventListener("change", () => calcularLinhaTabela(row));
        input.addEventListener("input", () => calcularLinhaTabela(row));
    });
    
    // Remover linha
    row.querySelector(".btn-remover").addEventListener("click", () => {
        row.remove();
        atualizarResumoMultiplos();
    });
}

function calcularLinhaTabela(row) {
    const custo = parseFloat(row.querySelector(".col-custo").value) || 0;
    const frete = parseFloat(row.querySelector(".col-frete").value) || 0;
    const taxa = (parseFloat(row.querySelector(".col-taxa").value) || 0) / 100;
    const imposto = (parseFloat(row.querySelector(".col-imposto").value) || 0) / 100;
    const margem = (parseFloat(row.querySelector(".col-margem").value) || 0) / 100;
    
    const denominador = 1 - taxa - imposto - margem;
    
    if (denominador <= 0) {
        row.querySelector(".col-preco").textContent = "⚠️ Inválido";
        row.querySelector(".col-lucro").textContent = "-";
        row.querySelector(".col-margem-real").textContent = "-";
        atualizarResumoMultiplos();
        return;
    }
    
    const preco = (custo + frete) / denominador;
    
    if (preco > 0 && isFinite(preco)) {
        const lucro = preco - custo - frete - (preco * taxa) - (preco * imposto);
        const margemReal = ((lucro / preco) * 100);
        
        row.querySelector(".col-preco").textContent = `R$ ${preco.toFixed(2)}`;
        row.querySelector(".col-lucro").textContent = `R$ ${lucro.toFixed(2)}`;
        row.querySelector(".col-margem-real").textContent = `${margemReal.toFixed(1)}%`;
    } else {
        row.querySelector(".col-preco").textContent = "-";
        row.querySelector(".col-lucro").textContent = "-";
        row.querySelector(".col-margem-real").textContent = "-";
    }
    
    atualizarResumoMultiplos();
}

function atualizarResumoMultiplos() {
    const linhas = document.querySelectorAll(".tabela-row");
    let totalProdutos = linhas.length;
    let lucroTotal = 0;
    let margemTotal = 0;
    let produtosValidos = 0;
    
    linhas.forEach(row => {
        const custo = parseFloat(row.querySelector(".col-custo").value) || 0;
        const frete = parseFloat(row.querySelector(".col-frete").value) || 0;
        const taxa = (parseFloat(row.querySelector(".col-taxa").value) || 0) / 100;
        const imposto = (parseFloat(row.querySelector(".col-imposto").value) || 0) / 100;
        const margem = (parseFloat(row.querySelector(".col-margem").value) || 0) / 100;
        
        const denominador = 1 - taxa - imposto - margem;
        
        if (denominador > 0) {
            const preco = (custo + frete) / denominador;
            
            if (preco > 0 && isFinite(preco)) {
                const lucro = preco - custo - frete - (preco * taxa) - (preco * imposto);
                const margemReal = ((lucro / preco) * 100);
                
                lucroTotal += lucro;
                margemTotal += margemReal;
                produtosValidos++;
            }
        }
    });
    
    const margemMedia = produtosValidos > 0 ? (margemTotal / produtosValidos) : 0;
    
    document.getElementById("totalProdutos").textContent = totalProdutos;
    document.getElementById("lucroTotal").textContent = `R$ ${lucroTotal.toFixed(2)}`;
    document.getElementById("margemMedia").textContent = `${margemMedia.toFixed(1)}%`;
}

// Atualizar renderizarHistorico original para usar a nova versão
const renderizarHistoricoOriginal = renderizarHistorico;
window.renderizarHistorico = function() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        if (btn.id === "tabPreco") {
            btn.addEventListener("click", () => {
                document.getElementById("resultado").style.display = "block";
                document.getElementById("viabilidade").style.display = "block";
                document.getElementById("detalhes").style.display = "block";
            });
        }
    });
    renderizarHistoricoAtualizado();
};