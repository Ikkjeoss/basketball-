let passordEl = document.querySelector("#admintext");
let enterBtnEl = document.querySelector("#enterBtn");

enterBtnEl.addEventListener("click", adminLogin);

// Tillat Enter-tast for å logge inn
passordEl.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        adminLogin();
    }
});

function adminLogin() {
    if (passordEl.value === "dingle") {
        localStorage.setItem("admin", "true");
        alert("Riktig passord! Sender deg til admin-siden.");
        window.location.href = "admin.html";
    } else {
        alert("Feil passord");
        passordEl.value = "";
        passordEl.focus();
    }
}
