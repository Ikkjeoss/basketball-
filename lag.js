let lagEl = document.getElementById("lag");
let leggEl = document.getElementById("legg_inp");
let tabellEl = document.querySelector("tbody");
let klasseEl = document.getElementById("grupper");
let resetEl = document.getElementById("reset");

sjekk();

leggEl.addEventListener("click", leggTil);
resetEl.addEventListener("click", reset);

function sjekk() {
    if (!localStorage.getItem("lagData")) {
        localStorage.lagData = "[]";
    }
    if (!localStorage.getItem("kamper")) {
        localStorage.kamper = "[]";
    }

    visLag();
    visKamper();
    oppdater();

    // Restore semifinal/finale state if it was saved
    const semi1 = localStorage.getItem("semi1");
    const semi2 = localStorage.getItem("semi2");
    if (semi1 && semi2) {
        gjenopprettSemifinaler();
    }
}

function leggTil() {
    let lagData = JSON.parse(localStorage.lagData);
    const navn = lagEl.value.trim();

    if (!navn) return;

    if (lagData.some(lag => lag.navn === navn)) {
        alert("laget finnes allerede");
        return;
    }

    const grupper = ["A", "B", "C", "D"];
    let groupIndex = lagData.length % grupper.length;

    lagData.push({ navn, gruppe: grupper[groupIndex] });
    localStorage.lagData = JSON.stringify(lagData);

    // Rebuild kamper list from scratch when teams change
    localStorage.kamper = JSON.stringify(byggKamper(lagData));

    lagEl.value = "";
    visLag();
    visKamper();
}

function fjernLag(navn) {
    let lagData = JSON.parse(localStorage.lagData);
    lagData = lagData.filter(l => l.navn !== navn);
    localStorage.lagData = JSON.stringify(lagData);
    localStorage.kamper = JSON.stringify(byggKamper(lagData));
    visLag();
    visKamper();
}

// Builds the full match schedule from lagData, preserving any already-saved scores
function byggKamper(lagData) {
    const eksisterendeKamper = JSON.parse(localStorage.kamper || "[]");
    const grupper = ["A", "B", "C", "D"];
    let alleKamper = [];
    let kampNr = 1;
    let startMinutter = 9 * 60;

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
                    kamper.push({ hjemme: hjemme.navn, borte: borte.navn, gruppe });
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
                const timer = Math.floor(total / 60);
                const minutter = total % 60;
                const tid = `${String(timer).padStart(2, "0")}:${String(minutter).padStart(2, "0")}`;

                // Preserve existing score if this match was already played
                const gammel = eksisterendeKamper.find(
                    k => k.hjemme === kamp.hjemme && k.borte === kamp.borte
                );

                alleKamper.push({
                    kampNr,
                    tid,
                    gruppe: kamp.gruppe,
                    hjemme: kamp.hjemme,
                    borte: kamp.borte,
                    hjemmeScore: gammel ? gammel.hjemmeScore : "",
                    borteScore: gammel ? gammel.borteScore : ""
                });

                kampNr++;
            });
        });
    }

    return alleKamper;
}

function visKamper() {
    const kamper = JSON.parse(localStorage.kamper || "[]");
    tabellEl.innerHTML = "";

    kamper.forEach(kamp => {
        const idx = kamp.kampNr - 1;
        const hVal = kamp.hjemmeScore !== "" ? kamp.hjemmeScore : "";
        const bVal = kamp.borteScore !== "" ? kamp.borteScore : "";
        const ferdig = kamp.hjemmeScore !== "" && kamp.borteScore !== "";

        tabellEl.innerHTML += `
            <tr${ferdig ? ' class="ferdig"' : ""}>
                <td>${kamp.kampNr}</td>
                <td class="tid">${kamp.tid}</td>
                <td>${kamp.gruppe}</td>
                <td>${kamp.hjemme}</td>
                <td>${kamp.borte}</td>
                <td><input type="number" placeholder="0" id="result${idx}_h" value="${hVal}"${ferdig ? " disabled" : ""}></td>
                <td><input type="number" placeholder="0" id="result${idx}_b" value="${bVal}"${ferdig ? " disabled" : ""}></td>
                <td><button onclick="registrerResultat(${idx})"${ferdig ? " disabled" : ""}>Ferdig</button></td>
            </tr>
        `;
    });
}

function registrerResultat(idx) {
    let kamper = JSON.parse(localStorage.kamper || "[]");
    const kamp = kamper[idx];

    const hjemmeScore = parseInt(document.getElementById(`result${idx}_h`).value);
    const borteScore = parseInt(document.getElementById(`result${idx}_b`).value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat for begge lag");
        return;
    }

    kamp.hjemmeScore = hjemmeScore;
    kamp.borteScore = borteScore;

    localStorage.kamper = JSON.stringify(kamper);

    visKamper();
    oppdater();
}

function visLag() {
    let lagData = JSON.parse(localStorage.lagData);
    const grupper = ["A", "B", "C", "D"];

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

function oppdater() {
    // vis_tabell.js reads from localStorage.kamper — nothing extra needed here.
    // Call this after any score change so index.html stays in sync automatically.
}

function reset() {
    localStorage.lagData = "[]";
    localStorage.kamper = "[]";
    localStorage.removeItem("semi1");
    localStorage.removeItem("semi2");
    localStorage.removeItem("semi1Vinner");
    localStorage.removeItem("semi2Vinner");
    localStorage.removeItem("finaleVinner");

    tabellEl.innerHTML = "";
    klasseEl.innerHTML = "";

    document.getElementById("semi-finale1").style.display = "none";
    document.getElementById("semi-finale1").innerHTML = "";
    document.getElementById("semi-finale2").style.display = "none";
    document.getElementById("semi-finale2").innerHTML = "";
    document.getElementById("finale").style.display = "none";
    document.getElementById("finale").innerHTML = "";
}

// --- KNOCKOUT ---

function tidFraKampNr(kampNr) {
    const startMinutter = 9 * 60;
    const total = startMinutter + kampNr * 10;
    const timer = Math.floor(total / 60);
    const minutter = total % 60;
    return `${String(timer).padStart(2, "0")}:${String(minutter).padStart(2, "0")}`;
}

function alleGruppekamperFerdige() {
    const kamper = JSON.parse(localStorage.kamper || "[]");
    if (kamper.length === 0) return false;
    return kamper.every(k => k.hjemmeScore !== "" && k.borteScore !== "");
}

function topLagIGruppe(gruppe) {
    // Compute standings from kamper, same logic as vis_tabell.js
    let lagData = JSON.parse(localStorage.lagData);
    let kamper = JSON.parse(localStorage.kamper || "[]");

    let stats = lagData
        .filter(l => l.gruppe === gruppe)
        .map(l => ({ navn: l.navn, poeng: 0, mol: 0, diff: 0, innslupne: 0 }));

    kamper.filter(k => k.gruppe === gruppe).forEach(kamp => {
        if (kamp.hjemmeScore === "" || kamp.borteScore === "") return;
        let h = stats.find(l => l.navn === kamp.hjemme);
        let b = stats.find(l => l.navn === kamp.borte);
        if (!h || !b) return;

        h.mol += Number(kamp.hjemmeScore);
        b.mol += Number(kamp.borteScore);
        h.innslupne += Number(kamp.borteScore);
        b.innslupne += Number(kamp.hjemmeScore);
        h.diff = h.mol - h.innslupne;
        b.diff = b.mol - b.innslupne;

        if (kamp.hjemmeScore > kamp.borteScore) {
            h.poeng += 3;
        } else if (kamp.borteScore > kamp.hjemmeScore) {
            b.poeng += 3;
        } else {
            h.poeng++;
            b.poeng++;
        }
    });

    stats.sort((a, b) => b.poeng - a.poeng || b.diff - a.diff || b.mol - a.mol);
    return stats[0];
}

function visSemifinaler() {
    if (!alleGruppekamperFerdige()) {
        alert("Ikke alle gruppekamper er ferdige ennå!");
        return;
    }

    const topA = topLagIGruppe("A");
    const topB = topLagIGruppe("B");
    const topC = topLagIGruppe("C");
    const topD = topLagIGruppe("D");

    const totalGruppekamper = JSON.parse(localStorage.kamper || "[]").length;
    const semi1Tid = tidFraKampNr(totalGruppekamper);
    const semi2Tid = tidFraKampNr(totalGruppekamper + 1);

    localStorage.setItem("semi1", JSON.stringify({ hjemme: topA.navn, borte: topB.navn, tid: semi1Tid }));
    localStorage.setItem("semi2", JSON.stringify({ hjemme: topC.navn, borte: topD.navn, tid: semi2Tid }));

    gjenopprettSemifinaler();
}

function gjenopprettSemifinaler() {
    const semi1 = JSON.parse(localStorage.getItem("semi1"));
    const semi2 = JSON.parse(localStorage.getItem("semi2"));
    const vinner1 = localStorage.getItem("semi1Vinner");
    const vinner2 = localStorage.getItem("semi2Vinner");

    document.getElementById("semi-finale1").style.display = "block";
    document.getElementById("semi-finale2").style.display = "block";

    document.getElementById("semi-finale1").innerHTML = `
        <h3>Semifinale 1 — ${semi1.tid}</h3>
        <p>${semi1.hjemme} vs ${semi1.borte}</p>
        <input type="number" placeholder="0" id="semi1_h"${vinner1 ? " disabled" : ""}>
        <input type="number" placeholder="0" id="semi1_b"${vinner1 ? " disabled" : ""}>
        <button onclick="registrerSemi(1)"${vinner1 ? " disabled" : ""}>Ferdig</button>
        ${vinner1 ? `<p><strong>Vinner: ${vinner1}</strong></p>` : ""}
    `;

    document.getElementById("semi-finale2").innerHTML = `
        <h3>Semifinale 2 — ${semi2.tid}</h3>
        <p>${semi2.hjemme} vs ${semi2.borte}</p>
        <input type="number" placeholder="0" id="semi2_h"${vinner2 ? " disabled" : ""}>
        <input type="number" placeholder="0" id="semi2_b"${vinner2 ? " disabled" : ""}>
        <button onclick="registrerSemi(2)"${vinner2 ? " disabled" : ""}>Ferdig</button>
        ${vinner2 ? `<p><strong>Vinner: ${vinner2}</strong></p>` : ""}
    `;

    if (vinner1 && vinner2) {
        sjekkOgVisFinale();
    }
}

function registrerSemi(semiNr) {
    const hjemmeScore = parseInt(document.getElementById(`semi${semiNr}_h`).value);
    const borteScore = parseInt(document.getElementById(`semi${semiNr}_b`).value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat for begge lag");
        return;
    }

    if (hjemmeScore === borteScore) {
        alert("Semifinaler kan ikke ende uavgjort — endre resultatet");
        return;
    }

    const semi = JSON.parse(localStorage.getItem(`semi${semiNr}`));
    const vinner = hjemmeScore > borteScore ? semi.hjemme : semi.borte;
    localStorage.setItem(`semi${semiNr}Vinner`, vinner);

    gjenopprettSemifinaler();
    sjekkOgVisFinale();
}

function sjekkOgVisFinale() {
    const vinner1 = localStorage.getItem("semi1Vinner");
    const vinner2 = localStorage.getItem("semi2Vinner");
    if (!vinner1 || !vinner2) return;

    const totalKamper = JSON.parse(localStorage.kamper || "[]").length;
    const finaleTid = tidFraKampNr(totalKamper + 2);
    localStorage.setItem("finaleTid", finaleTid);

    const finaleVinner = localStorage.getItem("finaleVinner");

    document.getElementById("finale").style.display = "block";
    document.getElementById("finale").innerHTML = `
        <h3>Finale — ${finaleTid}</h3>
        <p>${vinner1} vs ${vinner2}</p>
        <input type="number" placeholder="0" id="finale_h"${finaleVinner ? " disabled" : ""}>
        <input type="number" placeholder="0" id="finale_b"${finaleVinner ? " disabled" : ""}>
        <button onclick="registrerFinale()"${finaleVinner ? " disabled" : ""}>Ferdig</button>
        ${finaleVinner ? `<p><strong>🏆 Turneringsvinner: ${finaleVinner}!</strong></p>` : ""}
    `;
}

function registrerFinale() {
    const hjemmeScore = parseInt(document.getElementById("finale_h").value);
    const borteScore = parseInt(document.getElementById("finale_b").value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat for begge lag");
        return;
    }

    if (hjemmeScore === borteScore) {
        alert("Finalen kan ikke ende uavgjort — endre resultatet");
        return;
    }

    const vinner1 = localStorage.getItem("semi1Vinner");
    const vinner2 = localStorage.getItem("semi2Vinner");
    const vinner = hjemmeScore > borteScore ? vinner1 : vinner2;

    localStorage.setItem("finaleVinner", vinner);
    sjekkOgVisFinale();
}