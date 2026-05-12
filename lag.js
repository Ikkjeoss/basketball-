let lagEl = document.getElementById("lag")
let leggEl = document.getElementById("legg_inp");
let tabellEl = document.querySelector("tbody")

function sjekk() {

    if (!localStorage.getItem("lagData")) {
        localStorage.lagData = "[]";
    }

    if (localStorage.getItem("tabell")) {
        tabellEl.innerHTML = localStorage.getItem("tabell");
    }
    else {
        localStorage.tabell = "";
    }
}

sjekk();

leggEl.addEventListener("click", leggTil);

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

    lagData.push({ navn, tap: 0, vunnet: 0, uavgjort: 0, poeng: 0, mol: 0, gruppe: grupper[groupIndex] });
    localStorage.lagData = JSON.stringify(lagData);

    lagEl.value = "";
    visKamper();
}

function visKamper() {
    let lagData = JSON.parse(localStorage.lagData);
    tabellEl.innerHTML = "";

    let kampNr = 1;

    const grupper = ["A", "B", "C", "D"];

    let rundePerGruppe = {};
    grupper.forEach(gruppe => {
        let lag = [...lagData.filter(l => l.gruppe === gruppe)]
        let runder = [];

        if (lag.length % 2 !== 0) lag.push(null);

        for (let runde = 0; runde < lag.length - 1; runde++) {
            let kamper = []
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
    })

    let maxRunder = Math.max(...grupper.map(g => rundePerGruppe[g]?.length || 0));

    for (let runde = 0; runde < maxRunder; runde++) {
        grupper.forEach(gruppe => {
            let rundeKamper = rundePerGruppe[gruppe]?.[runde];
            if (!rundeKamper) return;

            rundeKamper.forEach(kamp => {
                tabellEl.innerHTML += `
                    <tr>
                    <td>${kampNr}</td>
                    <td class="tid"></td>
                    <td>${kamp.gruppe}</td>
                    <td>${kamp.hjemme.navn}</td>
                    <td>${kamp.borte.navn}</td>
                    <td><input type="number" placeholder="0" id="result${kampNr - 1}_h"></td>
                    <td><input type="number" placeholder="0" id="result${kampNr - 1}_b"></td>
                    <td><button onclick="registrerResultat(${kampNr - 1}, '${kamp.hjemme.navn}', '${kamp.borte.navn}')">Ferdig</button></td>
                    </tr>
                `;
                kampNr++;
            });
        });
    }

    localStorage.tabell = tabellEl.innerHTML
}

function registrerResultat(kampNr, hjemmeNavn, borteNavn) {
    let lagData = JSON.parse(localStorage.lagData);

    const hjemmeScoreEl = document.getElementById(`result${kampNr}_h`);
    const borteScoreEl = document.getElementById(`result${kampNr}_b`);

    const hjemmeScore = parseInt(hjemmeScoreEl.value);
    const borteScore = parseInt(borteScoreEl.value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat for begge lag");
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

    localStorage.lagData = JSON.stringify(lagData);
    visKamper();
}

 