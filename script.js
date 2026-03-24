// =============================
// ESTADO GLOBAL
// =============================
let modoAtual = "preco";
let comparadorChart = null;
let comparadorResultados = [null, null, null];

// =============================
// INICIALIZAÇÃO
// =============================
document.addEventListener("DOMContentLoaded", () => {
    // Tabs principais
    document.getElementById("tabPreco").addEventListener("click", () => mudarModo("preco"));
    document.getElementById("tabMargem").addEventListener("click", () => mudarModo("margem"));
    document.getElementById("tabComparador").addEventListener("click", () => mudarModo("comparador"));
    document.getElementById("tabMultiplos").addEventListener("click", () => mudarModo("multiplos"));

    // Calcular / Limpar
    document.getElementById("btnCalcular").addEventListener("click", calcular);
    document.getElementById("btnLimpar").addEventListener("click", limpar);

    // Copiar resultado
    document.getElementById("btnCopiar").addEventListener("click", copiarResultado);

    // Presets de margem
    document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("margem").value = btn.dataset.valor;
            calcular();
        });
    });

    // Modal de presets
    document.querySelector(".preset-edit-btn").addEventListener("click", () => {
        carregarPresetsPersonalizados();
        document.getElementById("presetsModal").style.display = "flex";
    });
    document.querySelector(".modal-close").addEventListener("click", () => {
        document.getElementById("presetsModal").style.display = "none";
    });
    document.getElementById("presetsModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("presetsModal"))
            document.getElementById("presetsModal").style.display = "none";
    });
    document.getElementById("savePresets").addEventListener("click", salvarPresets);

    // Comparador — botões calcular por produto
    document.querySelectorAll(".btn-comparar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const item = e.target.closest(".comparador-item");
            calcularComparador(item);
        });
    });

    // Botão IA do comparador
    document.getElementById("btnSugestaoIA").addEventListener("click", sugerirPrecoIA);

    // Múltiplos produtos
    document.getElementById("btnAdicionarProduto").addEventListener("click", () => adicionarLinhaTabela());

    // Filtro e limpeza do histórico
    document.getElementById("filtroHistorico").addEventListener("input", renderizarHistorico);
    document.getElementById("btnLimparHistorico").addEventListener("click", () => {
        if (confirm("Limpar todo o histórico?")) {
            localStorage.removeItem("historico");
            renderizarHistorico();
        }
    });

    // Margem mínima
    document.getElementById("margem-minima").addEventListener("input", () => {
        if (document.getElementById("resultado").innerText !== "R$ 0,00") verificarMargemMinima();
    });

    // Exportar
    document.getElementById("btnExportarPNG").addEventListener("click", exportarPNG);
    document.getElementById("btnExportarCSV").addEventListener("click", exportarCSV);
    document.getElementById("btnExportarPDF").addEventListener("click", exportarPDF);

    // Atalhos de teclado
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (modoAtual === "preco" || modoAtual === "margem")) {
            calcular();
        }
        if (e.key === "Escape") limpar();
    });

    // Tema salvo
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

    // Inicializar
    carregarPresetsPersonalizados();
    renderizarHistorico();
});

// =============================
// TROCA DE MODOS
// =============================
function mudarModo(modo) {
    modoAtual = modo;

    // Desativar tudo
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    ["modoPreco", "modoMargem", "modoComparador", "modoMultiplos"].forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove("modo-ativo");
        el.classList.add("modo-inativo");
    });

    const uiResultado = ["resultado", "viabilidade", "detalhes", "breakdown", "chartContainer"];
    const btnCalc = document.getElementById("btnCalcular");
    const btnLimp = document.getElementById("btnLimpar");
    const resultadoLabel = document.getElementById("resultadoLabel");
    const nomeProdutoSection = document.querySelector(".nome-produto-section");
    const alertaMargem = document.querySelector(".alerta-margem-section");

    if (modo === "preco") {
        document.getElementById("tabPreco").classList.add("active");
        ativar("modoPreco");
        btnCalc.style.display = "block";
        btnCalc.innerText = "Calcular Preço";
        btnLimp.style.display = "block";
        resultadoLabel.innerText = "Preço de Venda";
        uiResultado.forEach(id => mostrar(id));
        nomeProdutoSection.style.display = "block";
        alertaMargem.style.display = "block";
        document.querySelector(".exportar-section").style.display = "block";
        document.getElementById("breakdown").style.display = "none";
        document.getElementById("chartContainer").style.display = "none";
    } else if (modo === "margem") {
        document.getElementById("tabMargem").classList.add("active");
        ativar("modoMargem");
        btnCalc.style.display = "block";
        btnCalc.innerText = "Calcular Margem";
        btnLimp.style.display = "block";
        resultadoLabel.innerText = "Margem Real";
        uiResultado.forEach(id => mostrar(id));
        nomeProdutoSection.style.display = "block";
        alertaMargem.style.display = "block";
        document.querySelector(".exportar-section").style.display = "block";
        document.getElementById("breakdown").style.display = "none";
        document.getElementById("chartContainer").style.display = "none";
    } else if (modo === "comparador") {
        document.getElementById("tabComparador").classList.add("active");
        ativar("modoComparador");
        btnCalc.style.display = "none";
        btnLimp.style.display = "none";
        uiResultado.forEach(id => esconder(id));
        nomeProdutoSection.style.display = "none";
        alertaMargem.style.display = "none";
        document.querySelector(".exportar-section").style.display = "none";
    } else if (modo === "multiplos") {
        document.getElementById("tabMultiplos").classList.add("active");
        ativar("modoMultiplos");
        btnCalc.style.display = "none";
        btnLimp.style.display = "none";
        uiResultado.forEach(id => esconder(id));
        nomeProdutoSection.style.display = "none";
        alertaMargem.style.display = "none";
        document.querySelector(".exportar-section").style.display = "block";
    }

    document.getElementById("resultado").innerText = "R$ 0,00";
    document.getElementById("detalhes").innerText = "";
    document.getElementById("viabilidade").textContent = "";
}

function ativar(id) {
    const el = document.getElementById(id);
    el.classList.remove("modo-inativo");
    el.classList.add("modo-ativo");
}
function mostrar(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "";
}
function esconder(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

// =============================
// CALCULAR (dispatcher)
// =============================
function calcular() {
    if (modoAtual === "preco") calcularPreco();
    else calcularMargem();
}

// =============================
// MODO 1: CALCULAR PREÇO
// =============================
function calcularPreco() {
    const custo = parseFloat(document.getElementById("custo").value) || 0;
    const frete = parseFloat(document.getElementById("frete").value) || 0;
    const taxa = (parseFloat(document.getElementById("taxa").value) || 0) / 100;
    const imposto = (parseFloat(document.getElementById("imposto").value) || 0) / 100;
    const margem = (parseFloat(document.getElementById("margem").value) || 0) / 100;

    const resultadoEl = document.getElementById("resultado");
    const detalhesEl = document.getElementById("detalhes");
    const viabilidadeEl = document.getElementById("viabilidade");
    const breakdownEl = document.getElementById("breakdown");

    if ((taxa + imposto + margem) >= 1) {
        resultadoEl.innerText = "❌ Inválido";
        detalhesEl.innerText = "Taxas + margem não podem ultrapassar 100%";
        detalhesEl.className = "detalhes prejuizo";
        viabilidadeEl.textContent = "";
        breakdownEl.style.display = "none";
        return;
    }

    const preco = (custo + frete) / (1 - taxa - imposto - margem);

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

    const taxasAbsoluto = preco * taxa;
    const impostosAbsoluto = preco * imposto;
    const lucroValor = preco - custo - frete - taxasAbsoluto - impostosAbsoluto;
    const margemReal = (lucroValor / preco) * 100;

    detalhesEl.innerText = `Lucro: R$ ${lucroValor.toFixed(2)} • Margem: ${margemReal.toFixed(1)}%`;

    let classe, mensagem;
    if (margemReal < 0) {
        classe = "prejuizo"; mensagem = "❌ Prejuízo";
    } else if (margemReal < 10) {
        classe = "prejuizo"; mensagem = "❌ Margem Insuficiente";
    } else if (margemReal < 15) {
        classe = "atencao"; mensagem = "⚠️ Margem Apertada";
    } else {
        classe = "viavel"; mensagem = "✅ Margem Excelente";
    }

    viabilidadeEl.className = `badge-viabilidade ${classe}`;
    viabilidadeEl.textContent = mensagem;
    detalhesEl.className = `detalhes ${classe}`;

    exibirBreakdown(custo, frete, taxasAbsoluto, impostosAbsoluto, lucroValor, preco);
    atualizarGrafico(custo, frete, taxasAbsoluto, impostosAbsoluto, lucroValor);
    verificarMargemMinima();
    salvarHistoricoComNome({ tipo: "PREÇO", valor: preco, margem: (margem * 100).toFixed(1) });
}

// =============================
// MODO 2: CALCULAR MARGEM
// =============================
function calcularMargem() {
    const custo = parseFloat(document.getElementById("custoRev").value) || 0;
    const frete = parseFloat(document.getElementById("freteRev").value) || 0;
    const taxa = (parseFloat(document.getElementById("taxaRev").value) || 0) / 100;
    const imposto = (parseFloat(document.getElementById("impostoRev").value) || 0) / 100;
    const precoVenda = parseFloat(document.getElementById("precoVenda").value) || 0;

    const resultadoEl = document.getElementById("resultado");
    const detalhesEl = document.getElementById("detalhes");
    const viabilidadeEl = document.getElementById("viabilidade");

    if (precoVenda <= 0) {
        resultadoEl.innerText = "❌ Inválido";
        detalhesEl.innerText = "Digite um preço de venda válido";
        detalhesEl.className = "detalhes prejuizo";
        return;
    }

    const taxasAbsoluto = precoVenda * taxa;
    const impostosAbsoluto = precoVenda * imposto;
    const lucro = precoVenda - custo - frete - taxasAbsoluto - impostosAbsoluto;
    const margemReal = (lucro / precoVenda) * 100;

    animarNumero(margemReal);
    vibrar();

    // BUG CORRIGIDO: ordem de verificação (< 0 antes de < 5)
    let status, classe;
    if (margemReal < 0) {
        status = "❌ Prejuízo"; classe = "prejuizo";
    } else if (margemReal < 5) {
        status = "⚠️ Margem muito baixa"; classe = "atencao";
    } else if (margemReal < 10) {
        status = "⚠️ Margem apertada"; classe = "atencao";
    } else {
        status = "✅ Viável"; classe = "viavel";
    }

    detalhesEl.innerText = `${status} • Lucro: R$ ${lucro.toFixed(2)}`;
    detalhesEl.className = `detalhes ${classe}`;
    viabilidadeEl.className = `badge-viabilidade ${classe}`;
    viabilidadeEl.textContent = status;
    resultadoEl.innerText = `${margemReal.toFixed(1)}%`;

    verificarMargemMinima();
    salvarHistoricoComNome({ tipo: "MARGEM", valor: margemReal.toFixed(1), precoVenda });
}

// =============================
// BREAKDOWN
// =============================
function exibirBreakdown(custo, frete, taxa, imposto, lucro, precoTotal) {
    document.getElementById("breakdown").style.display = "block";
    const pct = v => ((v / precoTotal) * 100).toFixed(1) + "%";
    document.getElementById("bar-custo").style.width = pct(custo);
    document.getElementById("bar-frete").style.width = pct(frete);
    document.getElementById("bar-taxa").style.width = pct(taxa);
    document.getElementById("bar-imposto").style.width = pct(imposto);
    document.getElementById("bar-lucro").style.width = pct(lucro);
    document.getElementById("valor-custo").textContent = "R$ " + custo.toFixed(2);
    document.getElementById("valor-frete").textContent = "R$ " + frete.toFixed(2);
    document.getElementById("valor-taxa").textContent = "R$ " + taxa.toFixed(2);
    document.getElementById("valor-imposto").textContent = "R$ " + imposto.toFixed(2);
    document.getElementById("valor-lucro").textContent = "R$ " + lucro.toFixed(2);
}

// =============================
// GRÁFICO PIZZA (modo Preço)
// =============================
function atualizarGrafico(custo, frete, taxa, imposto, lucro) {
    const container = document.getElementById("chartContainer");
    container.style.display = "block";
    const ctx = document.getElementById("priceChart").getContext("2d");
    if (window.priceChart) window.priceChart.destroy();

    window.priceChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Custo", "Frete", "Taxa ML", "Imposto", "Lucro"],
            datasets: [{
                data: [custo, frete, taxa, imposto, Math.max(lucro, 0)],
                backgroundColor: ["#e74c3c", "#3498db", "#f39c12", "#e67e22", "#2ecc71"],
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
                        padding: 12,
                        color: document.body.classList.contains("dark-mode") ? "#eceff1" : "#333"
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `R$ ${ctx.parsed.toFixed(2).replace(".", ",")}`
                    }
                }
            }
        }
    });
}

// =============================
// MODO 3: COMPARADOR — CORRIGIDO
// =============================
function calcularComparador(item) {
    const custo = parseFloat(item.querySelector(".comp-custo").value) || 0;
    const frete = parseFloat(item.querySelector(".comp-frete").value) || 0;
    const taxa = (parseFloat(item.querySelector(".comp-taxa").value) || 0) / 100;
    const imposto = (parseFloat(item.querySelector(".comp-imposto").value) || 0) / 100;
    const preco = parseFloat(item.querySelector(".comp-preco").value) || 0;
    const index = parseInt(item.dataset.index);

    const resultadoEl = item.querySelector(".comp-resultado");

    if (preco === 0 || (custo + frete) === 0) {
        resultadoEl.innerHTML = `<span class="comp-invalido">⚠️ Dados inválidos</span>`;
        comparadorResultados[index] = null;
        atualizarGraficoComparador();
        return;
    }

    const lucro = preco - custo - frete - (preco * taxa) - (preco * imposto);
    const margemReal = (lucro / preco) * 100;

    let classe = margemReal >= 15 ? "viavel" : margemReal >= 10 ? "atencao" : "prejuizo";
    const nome = item.querySelector(".comp-nome").value || `Produto ${index + 1}`;

    resultadoEl.innerHTML = `
        <div class="comp-preco">R$ ${preco.toFixed(2)}</div>
        <div class="comp-detalhe ${classe}">Lucro: R$ ${lucro.toFixed(2)}</div>
        <div class="comp-detalhe ${classe}">Margem: ${margemReal.toFixed(1)}%</div>
    `;

    comparadorResultados[index] = { nome, preco, lucro, margemReal, custo, frete, taxa: preco * taxa, imposto: preco * imposto };
    atualizarGraficoComparador();
}

function atualizarGraficoComparador() {
    const validos = comparadorResultados.filter(r => r !== null);
    const container = document.getElementById("comparadorChartContainer");

    if (validos.length < 2) {
        container.style.display = "none";
        document.getElementById("btnSugestaoIA").style.display = "none";
        return;
    }

    container.style.display = "block";
    document.getElementById("btnSugestaoIA").style.display = "block";

    const ctx = document.getElementById("comparadorChart").getContext("2d");
    if (comparadorChart) comparadorChart.destroy();

    const isDark = document.body.classList.contains("dark-mode");
    const textColor = isDark ? "#eceff1" : "#333";

    comparadorChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: validos.map(r => r.nome),
            datasets: [
                {
                    label: "Preço Final (R$)",
                    data: validos.map(r => r.preco),
                    backgroundColor: "rgba(52, 152, 219, 0.8)",
                    borderColor: "#3498db",
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: "Lucro (R$)",
                    data: validos.map(r => r.lucro),
                    backgroundColor: "rgba(46, 204, 113, 0.8)",
                    borderColor: "#2ecc71",
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: "Margem (%)",
                    data: validos.map(r => r.margemReal),
                    backgroundColor: "rgba(241, 196, 15, 0.8)",
                    borderColor: "#f1c40f",
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: "y2"
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { font: { family: "'Poppins', sans-serif", size: 11 }, color: textColor, padding: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const v = ctx.parsed.y;
                            return ctx.dataset.label.includes("%")
                                ? `${ctx.dataset.label}: ${v.toFixed(1)}%`
                                : `${ctx.dataset.label}: R$ ${v.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor, font: { family: "'Poppins', sans-serif" } }, grid: { display: false } },
                y: {
                    position: "left",
                    ticks: { color: textColor, callback: v => `R$ ${v.toFixed(0)}`, font: { family: "'Poppins', sans-serif", size: 10 } },
                    grid: { color: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }
                },
                y2: {
                    position: "right",
                    ticks: { color: "#f1c40f", callback: v => `${v.toFixed(0)}%`, font: { family: "'Poppins', sans-serif", size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// =============================
// SUGESTÃO DE PREÇO VIA IA
// =============================
async function sugerirPrecoIA() {
    const validos = comparadorResultados.filter(r => r !== null);
    if (validos.length < 2) return;

    const btn = document.getElementById("btnSugestaoIA");
    const boxIA = document.getElementById("iaResultBox");
    const textoIA = document.getElementById("iaResultText");

    btn.disabled = true;
    btn.innerHTML = "⏳ Analisando...";
    boxIA.style.display = "block";
    textoIA.innerHTML = `<span class="ia-loading">🤖 A IA está analisando os produtos...</span>`;

    const resumo = validos.map((r, i) =>
        `Produto ${i + 1} — "${r.nome}": Preço R$${r.preco.toFixed(2)}, Custo R$${(r.custo + r.frete).toFixed(2)}, Taxa ML R$${r.taxa.toFixed(2)}, Imposto R$${r.imposto.toFixed(2)}, Lucro R$${r.lucro.toFixed(2)}, Margem ${r.margemReal.toFixed(1)}%`
    ).join("\n");

    const prompt = `Você é um especialista em precificação para marketplace (Mercado Livre). Analise os dados abaixo e dê uma recomendação estratégica objetiva em português brasileiro.

Produtos comparados:
${resumo}

Responda em 3 blocos curtos:
1. 🏆 Melhor opção: qual produto tem a melhor relação custo-benefício e por quê (2 linhas).
2. ⚡ Ponto de atenção: o principal risco ou problema identificado (2 linhas).
3. 💡 Sugestão prática: uma ação concreta para melhorar a rentabilidade (2 linhas).

Seja direto e prático. Não use markdown com asteriscos, apenas texto simples.`;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        const texto = data.content?.map(b => b.text || "").join("") || "Não foi possível obter uma resposta.";

        textoIA.innerHTML = texto
            .split("\n")
            .filter(l => l.trim())
            .map(l => `<p>${l}</p>`)
            .join("");
    } catch (err) {
        textoIA.innerHTML = `<span class="ia-erro">❌ Erro ao conectar com a IA. Verifique sua conexão.</span>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "🧠 Sugestão da IA";
    }
}

// =============================
// MODO 4: MÚLTIPLOS PRODUTOS
// =============================
function adicionarLinhaTabela(dados = {}) {
    const tabela = document.getElementById("tabelaProdutos");
    const id = Date.now();

    const row = document.createElement("div");
    row.className = "tabela-row";
    row.dataset.id = id;

    row.innerHTML = `
        <div class="row-campo">
            <label class="row-label">Nome</label>
            <input type="text" placeholder="Nome" class="col-nome" value="${dados.nome || ''}">
        </div>
        <div class="row-campo">
            <label class="row-label">Custo R$</label>
            <input type="number" placeholder="0" class="col-custo" step="0.01" value="${dados.custo || ''}">
        </div>
        <div class="row-campo">
            <label class="row-label">Frete R$</label>
            <input type="number" placeholder="0" class="col-frete" step="0.01" value="${dados.frete || ''}">
        </div>
        <div class="row-campo">
            <label class="row-label">Taxa %</label>
            <input type="number" placeholder="0" class="col-taxa" step="0.1" value="${dados.taxa || ''}">
        </div>
        <div class="row-campo">
            <label class="row-label">Imposto %</label>
            <input type="number" placeholder="0" class="col-imposto" step="0.1" value="${dados.imposto || ''}">
        </div>
        <div class="row-campo">
            <label class="row-label">Margem %</label>
            <input type="number" placeholder="0" class="col-margem" step="0.1" value="${dados.margem || ''}">
        </div>
        <div class="row-resultados">
            <div class="row-result-item">
                <span class="row-result-label">Preço</span>
                <span class="col-preco row-result-valor">—</span>
            </div>
            <div class="row-result-item">
                <span class="row-result-label">Lucro</span>
                <span class="col-lucro row-result-valor">—</span>
            </div>
            <div class="row-result-item">
                <span class="row-result-label">Margem Real</span>
                <span class="col-margem-real row-result-valor">—</span>
            </div>
            <button type="button" class="btn-remover-linha" data-id="${id}">🗑️</button>
        </div>
    `;

    tabela.appendChild(row);

    row.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => calcularLinhaTabela(row));
    });

    row.querySelector(".btn-remover-linha").addEventListener("click", () => {
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
    const precoEl = row.querySelector(".col-preco");
    const lucroEl = row.querySelector(".col-lucro");
    const margemEl = row.querySelector(".col-margem-real");

    if (denominador <= 0) {
        precoEl.textContent = "⚠️";
        lucroEl.textContent = "—";
        margemEl.textContent = "—";
        row.className = "tabela-row status-invalido";
        atualizarResumoMultiplos();
        return;
    }

    const preco = (custo + frete) / denominador;
    if (preco > 0 && isFinite(preco)) {
        const lucro = preco - custo - frete - (preco * taxa) - (preco * imposto);
        const margemReal = (lucro / preco) * 100;

        precoEl.textContent = `R$ ${preco.toFixed(2)}`;
        lucroEl.textContent = `R$ ${lucro.toFixed(2)}`;
        margemEl.textContent = `${margemReal.toFixed(1)}%`;

        row.className = "tabela-row " + (
            margemReal < 0 ? "status-prejuizo" :
            margemReal < 10 ? "status-atencao" :
            "status-viavel"
        );
    } else {
        precoEl.textContent = "—";
        lucroEl.textContent = "—";
        margemEl.textContent = "—";
        row.className = "tabela-row";
    }

    atualizarResumoMultiplos();
}

function atualizarResumoMultiplos() {
    const linhas = document.querySelectorAll(".tabela-row");
    let lucroTotal = 0, margemTotal = 0, produtosValidos = 0;

    linhas.forEach(row => {
        const custo = parseFloat(row.querySelector(".col-custo").value) || 0;
        const frete = parseFloat(row.querySelector(".col-frete").value) || 0;
        const taxa = (parseFloat(row.querySelector(".col-taxa").value) || 0) / 100;
        const imposto = (parseFloat(row.querySelector(".col-imposto").value) || 0) / 100;
        const margem = (parseFloat(row.querySelector(".col-margem").value) || 0) / 100;
        const den = 1 - taxa - imposto - margem;
        if (den > 0) {
            const preco = (custo + frete) / den;
            if (preco > 0 && isFinite(preco)) {
                const lucro = preco - custo - frete - (preco * taxa) - (preco * imposto);
                lucroTotal += lucro;
                margemTotal += (lucro / preco) * 100;
                produtosValidos++;
            }
        }
    });

    document.getElementById("totalProdutos").textContent = linhas.length;
    document.getElementById("lucroTotal").textContent = `R$ ${lucroTotal.toFixed(2)}`;
    document.getElementById("margemMedia").textContent = produtosValidos > 0
        ? `${(margemTotal / produtosValidos).toFixed(1)}%` : "0%";
}

// =============================
// ANIMAÇÃO / VIBRAÇÃO
// =============================
function animarNumero(valorFinal) {
    const el = document.getElementById("resultado");
    const isPercentage = modoAtual === "margem";
    let start = null;
    const duracao = 600;

    function frame(t) {
        if (!start) start = t;
        const progress = Math.min((t - start) / duracao, 1);
        const valor = valorFinal * progress;
        el.innerText = isPercentage ? `${valor.toFixed(1)}%` : `R$ ${valor.toFixed(2)}`;
        if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function vibrar() {
    if (navigator.vibrate) navigator.vibrate(50);
}

// =============================
// LIMPAR
// =============================
function limpar() {
    document.getElementById("modoPreco").reset();
    document.getElementById("modoMargem").reset();
    document.getElementById("resultado").innerText = "R$ 0,00";
    document.getElementById("resultado").className = "resultado";
    document.getElementById("detalhes").innerText = "";
    document.getElementById("viabilidade").innerHTML = "";
    document.getElementById("breakdown").style.display = "none";
    document.getElementById("chartContainer").style.display = "none";
    if (window.priceChart) { window.priceChart.destroy(); window.priceChart = null; }
}

// =============================
// COPIAR
// =============================
async function copiarResultado() {
    const resultado = document.getElementById("resultado").innerText;
    try {
        await navigator.clipboard.writeText(resultado);
        const btn = document.getElementById("btnCopiar");
        btn.classList.add("copiado");
        btn.textContent = "✓";
        setTimeout(() => { btn.classList.remove("copiado"); btn.textContent = "📋"; }, 2000);
    } catch (err) {
        alert("Erro ao copiar: " + err);
    }
}

// =============================
// PRESETS PERSONALIZADOS
// =============================
function carregarPresetsPersonalizados() {
    const presets = JSON.parse(localStorage.getItem("presetsPersonalizados")) || { preset1: 15, preset2: 20, preset3: 30 };
    ["preset1", "preset2", "preset3"].forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = presets[key];
    });
    atualizarBotoesPreset(presets);
}

function atualizarBotoesPreset(presets) {
    document.querySelectorAll(".preset-btn").forEach((btn, i) => {
        const key = `preset${i + 1}`;
        btn.textContent = `${presets[key]}%`;
        btn.dataset.valor = presets[key];
    });
}

function salvarPresets() {
    const presets = {
        preset1: parseFloat(document.getElementById("preset1").value) || 15,
        preset2: parseFloat(document.getElementById("preset2").value) || 20,
        preset3: parseFloat(document.getElementById("preset3").value) || 30
    };
    localStorage.setItem("presetsPersonalizados", JSON.stringify(presets));
    atualizarBotoesPreset(presets);
    document.getElementById("presetsModal").style.display = "none";
}

// =============================
// MARGEM MÍNIMA
// =============================
function verificarMargemMinima() {
    const margemMinima = parseFloat(document.getElementById("margem-minima").value) || 0;
    const detalhes = document.getElementById("detalhes").innerText;
    const match = detalhes.match(/Margem[:\s]+([\d.]+)%/);
    if (!match) return;

    const margemReal = parseFloat(match[1]);
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

// =============================
// HISTÓRICO
// =============================
function salvarHistoricoComNome(dados) {
    const historico = JSON.parse(localStorage.getItem("historico")) || [];
    const nome = document.getElementById("nomeProduto").value || "Sem nome";
    historico.unshift({ ...dados, nome, data: new Date().toLocaleString("pt-BR") });
    localStorage.setItem("historico", JSON.stringify(historico));
    document.getElementById("nomeProduto").value = "";
    renderizarHistorico();
}

function renderizarHistorico() {
    const lista = document.getElementById("listaHistorico");
    if (!lista) return;

    const historico = JSON.parse(localStorage.getItem("historico")) || [];
    const filtro = document.getElementById("filtroHistorico")?.value.toLowerCase() || "";
    lista.innerHTML = "";

    historico
        .filter(item => item.nome.toLowerCase().includes(filtro))
        .slice(0, 10)
        .forEach((item, _, arr) => {
            const div = document.createElement("div");
            div.className = "item-historico";

            const conteudo = item.tipo === "PREÇO"
                ? `<strong>${item.nome}</strong> — 💰 R$ ${parseFloat(item.valor).toFixed(2)} <small>(Margem: ${item.margem}%)</small>`
                : `<strong>${item.nome}</strong> — 📊 ${item.valor}% <small>(Preço: R$ ${parseFloat(item.precoVenda).toFixed(2)})</small>`;

            div.innerHTML = `
                <div>
                    ${conteudo}
                    <br><small class="historico-data">${item.data}</small>
                </div>
                <button class="btn-remover-item" data-index="${historico.indexOf(item)}">✕</button>
            `;
            lista.appendChild(div);
        });

    document.querySelectorAll(".btn-remover-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt(e.target.dataset.index);
            historico.splice(idx, 1);
            localStorage.setItem("historico", JSON.stringify(historico));
            renderizarHistorico();
        });
    });
}

// =============================
// EXPORTAR
// =============================
async function exportarPNG() {
    const container = document.querySelector(".resultado-container");
    const canvas = await html2canvas(container, { backgroundColor: "#fff" });
    const link = document.createElement("a");
    link.href = canvas.toDataURL();
    link.download = `calculo_${Date.now()}.png`;
    link.click();
}

function exportarCSV() {
    let csv = "";
    if (modoAtual === "multiplos") {
        csv = "Nome,Custo,Frete,Taxa %,Imposto %,Margem %,Preço Final,Lucro,Margem Real %\n";
        document.querySelectorAll(".tabela-row").forEach(row => {
            csv += [
                row.querySelector(".col-nome").value || "Sem nome",
                row.querySelector(".col-custo").value || "0",
                row.querySelector(".col-frete").value || "0",
                row.querySelector(".col-taxa").value || "0",
                row.querySelector(".col-imposto").value || "0",
                row.querySelector(".col-margem").value || "0",
                row.querySelector(".col-preco").textContent,
                row.querySelector(".col-lucro").textContent,
                row.querySelector(".col-margem-real").textContent
            ].map(v => `"${v}"`).join(",") + "\n";
        });
        csv += `\nTotal,,,,,,,${document.getElementById("lucroTotal").textContent},${document.getElementById("margemMedia").textContent}\n`;
    } else {
        const historico = JSON.parse(localStorage.getItem("historico")) || [];
        csv = "Nome,Tipo,Valor,Data\n";
        historico.forEach(item => {
            csv += `"${item.nome}","${item.tipo}","${item.valor}","${item.data}"\n`;
        });
    }
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = `exportacao_${Date.now()}.csv`;
    link.click();
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const resultado = document.getElementById("resultado").innerText;
    const detalhes = document.getElementById("detalhes").innerText;
    pdf.setFont("helvetica", "bold");
    pdf.text("Click Fun — Calculadora de Precificação", 10, 15);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Resultado: ${resultado}`, 10, 30);
    pdf.text(`Detalhes: ${detalhes}`, 10, 40);
    pdf.text(`Data: ${new Date().toLocaleString("pt-BR")}`, 10, 50);
    pdf.save(`calculo_${Date.now()}.pdf`);
}