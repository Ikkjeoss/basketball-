document.addEventListener("DOMContentLoaded", sjekk);

let lagEl = document.getElementById("lag");
let leggEl = document.getElementById("legg_inp");
let tabellEl = document.querySelector("tbody");
let klasseEl = document.getElementById("grupper");
let resetEl = document.getElementById("reset");

if (leggEl) leggEl.addEventListener("click", leggTil);
if (resetEl) resetEl.addEventListener("click", reset);

function sjekk() {

    if (!localStorage.getItem("lagData")) {
        localStorage.setItem("lagData", "[]");
    }

    visLag();
    visKamper();
}

function leggTil() {

    let lagData = JSON.parse(localStorage.getItem("lagData") || "[]");

    const navn = lagEl.value.trim();
    if (!navn) return;

    if (lagData.some(lag => lag.navn === navn)) {
        alert("Laget finnes allerede");
        return;
    }

    const grupper = ["A", "B", "C", "D"];

    let gruppeTelling = { A: 0, B: 0, C: 0, D: 0 };

    lagData.forEach(l => {
        gruppeTelling[l.gruppe]++;
    });

    let minsteGruppe = grupper.reduce((a, b) =>
        gruppeTelling[a] < gruppeTelling[b] ? a : b
    );

    lagData.push({
        navn,
        tap: 0,
        vunnet: 0,
        uavgjort: 0,
        poeng: 0,
        mol: 0,
        gruppe: minsteGruppe
    });

    localStorage.setItem("lagData", JSON.stringify(lagData));

    lagEl.value = "";

    visLag();
    visKamper();
}

function visLag() {

    let lagData = JSON.parse(localStorage.getItem("lagData") || "[]");
    const grupper = ["A", "B", "C", "D"];

    if (!klasseEl) return;

    klasseEl.innerHTML = grupper.map(gruppe => {

        const lagIGruppe = lagData.filter(lag => lag.gruppe === gruppe);

        if (lagIGruppe.length === 0) return "";

        return `
            <div class="gruppe">
                <h3>Gruppe ${gruppe}</h3>
                <ul>
                    ${lagIGruppe.map(lag => `
                        <li>
                            ${lag.navn}
                            <button onclick="fjernLag('${lag.navn}')">Fjern</button>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `;
    }).join("");
}

function visKamper() {

    let lagData = JSON.parse(localStorage.getItem("lagData") || "[]");

    if (!tabellEl) return;

    tabellEl.innerHTML = "";

    let kampNr = 1;
    let startMinutter = 9 * 60;

    const grupper = ["A", "B", "C", "D"];

    let rundePerGruppe = {};

    grupper.forEach(gruppe => {

        let lag = [...lagData.filter(l => l.gruppe === gruppe)];
        let runder = [];

        if (lag.length % 2 !== 0) lag.push(null);

        for (let runde = 0; runde < lag.length - 1; runde++) {

            let kamper = [];

            for (let i = 0; i < lag.length / 2; i++) {

                let hjemme = lag[i];
                let borte = lag[lag.length - 1 - i];

                if (hjemme && borte) {
                    kamper.push({ hjemme, borte, gruppe });
                }
            }

            runder.push(kamper);

            lag = [lag[0], lag[lag.length - 1], ...lag.slice(1, lag.length - 1)];
        }

        rundePerGruppe[gruppe] = runder;
    });

    let maxRunder = Math.max(...grupper.map(g => rundePerGruppe[g]?.length || 0));

    for (let runde = 0; runde < maxRunder; runde++) {

        grupper.forEach(gruppe => {

            let rundeKamper = rundePerGruppe[gruppe]?.[runde];
            if (!rundeKamper) return;

            rundeKamper.forEach(kamp => {

                const total = startMinutter + (kampNr - 1) * 10;

                const tid = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

                tabellEl.innerHTML += `
                    <tr>
                        <td>${kampNr}</td>
                        <td>${tid}</td>
                        <td>${kamp.gruppe}</td>
                        <td>${kamp.hjemme.navn}</td>
                        <td>${kamp.borte.navn}</td>

                        <td><input type="number" id="result${kampNr - 1}_h"></td>
                        <td><input type="number" id="result${kampNr - 1}_b"></td>

                        <td>
                            <button onclick="registrerResultat(${kampNr - 1}, '${kamp.hjemme.navn}', '${kamp.borte.navn}')">
                                Ferdig
                            </button>
                        </td>
                    </tr>
                `;

                kampNr++;
            });
        });
    }
}

function registrerResultat(kampNr, hjemmeNavn, borteNavn) {

    let lagData = JSON.parse(localStorage.getItem("lagData") || "[]");

    const hjemmeScoreEl = document.getElementById(`result${kampNr}_h`);
    const borteScoreEl = document.getElementById(`result${kampNr}_b`);

    const hjemmeScore = parseInt(hjemmeScoreEl.value);
    const borteScore = parseInt(borteScoreEl.value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat");
        return;
    }

    let hjemmeLag = lagData.find(l => l.navn === hjemmeNavn);
    let borteLag = lagData.find(l => l.navn === borteNavn);

    hjemmeLag.mol += hjemmeScore;
    borteLag.mol += borteScore;

    if (hjemmeScore > borteScore) {

        hjemmeLag.vunnet++;
        hjemmeLag.poeng += 3;
        borteLag.tap++;

    } else if (borteScore > hjemmeScore) {

        borteLag.vunnet++;
        borteLag.poeng += 3;
        hjemmeLag.tap++;

    } else {

        hjemmeLag.uavgjort++;
        borteLag.uavgjort++;

        hjemmeLag.poeng++;
        borteLag.poeng++;
    }

    localStorage.setItem("lagData", JSON.stringify(lagData));

    visKamper();
}

function fjernLag(navn) {

    let lagData = JSON.parse(localStorage.getItem("lagData") || "[]");

    lagData = lagData.filter(l => l.navn !== navn);

    localStorage.setItem("lagData", JSON.stringify(lagData));

    visLag();
    visKamper();
}

function reset() {

    localStorage.setItem("lagData", "[]");

    if (tabellEl) tabellEl.innerHTML = "";
    if (klasseEl) klasseEl.innerHTML = "";

    visLag();
    visKamper();
}