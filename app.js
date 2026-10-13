// 1. Buscamos los elementos del HTML que vamos a usar.
const temperatura = document.querySelector("#temperatura");
const dia = document.querySelector("#dia");
const humedad = document.querySelector("#humedad");
const viento = document.querySelector("#viento");
const fecha = document.querySelector("#fecha");
const estado = document.querySelector("#estado");

const btnAyer = document.querySelector("#btnAyer");
const btnHoy = document.querySelector("#btnHoy");
const btnManana = document.querySelector("#btnManana");
const btnActualizar = document.querySelector("#btnActualizar");

// Al principio todavía no tenemos el clima. null significa "sin valor".
let climaAyer = null;
let climaHoy = null;
let climaManana = null;

// 2. Esta dirección pide el clima de Saladillo a Open-Meteo.
// El signo + une las partes para que la dirección sea fácil de leer.
const url = "https://api.open-meteo.com/v1/forecast"
    + "?latitude=-35.637&longitude=-59.778"
    + "&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
    + "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
    + "&past_days=1&forecast_days=2"
    + "&timezone=America%2FArgentina%2FBuenos_Aires";

// 3. Mostramos las propiedades del objeto clima en la pantalla.
function mostrarClima(clima) {
    dia.textContent = clima.descripcion;
    temperatura.textContent = clima.temperatura + " °C";
    humedad.textContent = clima.humedad;
    viento.textContent = clima.viento;
    fecha.textContent = "Fecha del dato: " + clima.fecha;
}

// La API trae listas por hora. La posición permite elegir una hora.
function crearClimaPorHora(datos, posicion, descripcion) {
    return {
        descripcion: descripcion,
        temperatura: datos.hourly.temperature_2m[posicion],
        humedad: datos.hourly.relative_humidity_2m[posicion],
        viento: datos.hourly.wind_speed_10m[posicion],
        fecha: datos.hourly.time[posicion]
    };
}

function habilitarBotones() {
    btnAyer.disabled = false;
    btnHoy.disabled = false;
    btnManana.disabled = false;
}

// 4. async permite usar await: esperamos la respuesta sin bloquear la web.
async function cargarClima() {
    estado.textContent = "Buscando el clima...";
    btnActualizar.disabled = true;

    // try intenta hacer la consulta. catch se ejecuta si algo falla.
    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) {
            throw new Error("La API no respondió correctamente");
        }

        // json() convierte la respuesta en un objeto de JavaScript.
        const datos = await respuesta.json();

        // Pedimos días completos: ayer, hoy y mañana (72 horas).
        // Las listas empiezan en 0: ayer a las 12 es la posición 12.
        // Mañana a las 12 es la posición 60: 24 + 24 + 12.
        climaAyer = crearClimaPorHora(datos, 12, "Ayer a las 12:00");
        climaManana = crearClimaPorHora(datos, 60, "Mañana a las 12:00");

        climaHoy = {
            descripcion: "Clima actual",
            temperatura: datos.current.temperature_2m,
            humedad: datos.current.relative_humidity_2m,
            viento: datos.current.wind_speed_10m,
            fecha: datos.current.time
        };

        mostrarClima(climaHoy);
        habilitarBotones();
        estado.textContent = "Datos actualizados.";
        guardarClima();
    } catch (error) {
        estado.textContent = "No se pudo actualizar. Revisá Internet.";
        recuperarClima();
    }

    btnActualizar.disabled = false;
}

// 5. Cada función se ejecuta cuando hacemos clic en su botón.
// function () es una función sin nombre que dejamos preparada aquí.
btnAyer.addEventListener("click", function () {
    mostrarClima(climaAyer);
});

btnHoy.addEventListener("click", function () {
    mostrarClima(climaHoy);
});

btnManana.addEventListener("click", function () {
    mostrarClima(climaManana);
});

btnActualizar.addEventListener("click", cargarClima);

// 6. Foto opcional: se muestra solo en esta página.
const foto = document.querySelector("#foto");
const vistaFoto = document.querySelector("#vistaFoto");
let direccionFoto = null;

foto.addEventListener("change", function () {
    const archivo = foto.files[0];
    if (!archivo) {
        return; // Si cancelamos la selección, no hacemos nada.
    }

    // Liberamos la dirección anterior antes de mostrar otra foto.
    if (direccionFoto) {
        URL.revokeObjectURL(direccionFoto);
    }
    direccionFoto = URL.createObjectURL(archivo);
    vistaFoto.src = direccionFoto;
    vistaFoto.hidden = false;
});

// 7. Hacemos la primera consulta al abrir la página.
cargarClima();

// 8. Solo en la PWA: conservamos los tres objetos en el navegador.
function guardarClima() {
    const copia = {
        ayer: climaAyer,
        hoy: climaHoy,
        manana: climaManana
    };

    try {
        // localStorage guarda texto. stringify convierte un objeto a texto.
        localStorage.setItem("clima-saladillo", JSON.stringify(copia));
    } catch (error) {
        estado.textContent = "Clima actualizado, pero no se pudo guardar.";
    }
}

function recuperarClima() {
    try {
        const texto = localStorage.getItem("clima-saladillo");
        if (texto === null) {
            estado.textContent = "Sin conexión y sin datos guardados.";
            return;
        }

        // parse hace lo contrario: convierte el texto en un objeto.
        const copia = JSON.parse(texto);
        climaAyer = copia.ayer;
        climaHoy = copia.hoy;
        climaManana = copia.manana;

        mostrarClima(climaHoy);
        habilitarBotones();
        estado.textContent = "Consulta guardada. Fecha: " + climaHoy.fecha
            + ". Los botones se refieren a ese día, no al día actual.";
    } catch (error) {
        estado.textContent = "No se pudo leer la consulta guardada.";
    }
}

// 9. Registramos el archivo que permite abrir la interfaz sin Internet.
async function prepararPwa() {
    const estadoPwa = document.querySelector("#estadoPwa");

    if ("serviceWorker" in navigator) {
        try {
            await navigator.serviceWorker.register("./sw.js");
            await navigator.serviceWorker.ready;
            estadoPwa.textContent = "PWA preparada. Recargá antes de probar offline.";
        } catch (error) {
            estadoPwa.textContent = "No se pudo preparar la PWA. Usá localhost o HTTPS.";
        }
    } else {
        estadoPwa.textContent = "Este navegador no admite service workers.";
    }
}

prepararPwa();
