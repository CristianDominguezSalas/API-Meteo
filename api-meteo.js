function generarURL(localidad, tipoDatos = 'hourly') {
    const localidades = [
        { nombre: "Almería", latitud: 36.834, longitud: -2.4637 },
        { nombre: "Granada", latitud: 37.1773, longitud: -3.5986 },
        { nombre: "Málaga", latitud: 36.7213, longitud: -4.4214 },
        { nombre: "Motril", latitud: 36.7507, longitud: -3.5179 }
    ];
   
    const localidadDatos = localidades.find(
        (loc) => loc.nombre.toLowerCase() === localidad.toLowerCase()
    );

    if (!localidadDatos) {
        throw new Error(`No se encontró la localidad: ${localidad}`);
    }

    const { latitud, longitud } = localidadDatos;

    if(tipoDatos === "hourly"){
        return `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&hourly=temperature_2m,precipitation_probability&timezone=auto`;
    }else if (tipoDatos === "daily"){
        return `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=8`;
    }
}

function formatearFecha(fechaStr){
    const opciones = { weekday: 'short', day: 'numeric', month: 'short'};
    return new Date(fechaStr).toLocaleDateString('es-ES', opciones);
}

function procesarPrevisionDiaria(datos){
    const { time, temperature_2m_max, temperature_2m_min, precipitation_probability_max } = datos.daily;
    const previsionSemanal = [];

    for (let i = 0; i < time.length; i++){
        previsionSemanal.push({
            fecha: formatearFecha(time[i]),
            tempMax: temperature_2m_max[i].toFixed(2),
            tempMin: temperature_2m_min[i].toFixed(2),
            probLluvia: precipitation_probability_max[i].toFixed(2),
            emoji: obtenerEmoji(precipitation_probability_max[i])
        });
    }
    if (previsionSemanal.length > 0){
        previsionSemanal[0].fecha = "Hoy (" + previsionSemanal[0].fecha + ")";
    }
    return previsionSemanal;
}

function mostrarPrevisionSemanal(previsionSemanal){
    const contenedor = document.querySelector("#previsionSemanal");
    contenedor.innerHTML = "";

    const lista = document.createElement('ul');
    lista.classList.add('prevision-list');

    previsionSemanal.forEach(dia => {
        const item = document.createElement('li');
        item.innerHTML = `${dia.fecha}: ${dia.emoji} | Max: ${dia.tempMax}º | Min: ${dia.tempMin}º | Lluvia: ${dia.probLluvia}%`;

        lista.appendChild(item);
    });
    contenedor.appendChild(lista);
}

async function obtenerDatos(localidad, tipoDatos = "hourly") {
    try {
        const url = generarURL(localidad, tipoDatos);
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("Error al obtener los datos");
        const datos = await respuesta.json();   
        return datos;       
    } catch (error) {
        console.log(`Se ha producido el siguiente error: ${error}`)
    }
}

function calcularMedias(datos) {
    const temps = datos.hourly.temperature_2m;
    const lluvias = datos.hourly.precipitation_probability;

    const mediaTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const mediaLluvia = lluvias.reduce((a, b) => a + b, 0) / lluvias.length;

    return {
        temperaturaMedia: mediaTemp.toFixed(0),
        probabilidadMediaLluvia: mediaLluvia.toFixed(0)
    };
}

function obtenerEmoji(probabilidad){
    const emojis = ["🌞", "⛅", "🌦️", "🌧️", "⛈️"];
    if(probabilidad === 0){
        return emojis[0];
    }
    else if(probabilidad > 0 && probabilidad <= 30){
        return emojis[1];
    }
    else if(probabilidad > 30 && probabilidad <=60){
        return emojis[2];
    }
    else if(probabilidad>60 && probabilidad <= 80){
        return emojis[3];
    }
    else{
        return emojis[4];
    }
}

function mostrarDatos(localidad, medias){
    document.querySelector("#localidad").innerHTML = localidad;
    document.querySelector("#temperatura").innerHTML = medias.temperaturaMedia;
    const emojiDia = obtenerEmoji(medias.probabilidadMediaLluvia);
    document.querySelector("#emojiDia").innerHTML = emojiDia;
}



async function actualizarDatos(localidad) {

  const [resultadoHorario, resultadoDiario] = await Promise.all([
    obtenerDatos(localidad, 'hourly'), 
    obtenerDatos(localidad, 'daily') 
  ]);

  if (resultadoHorario) {
    const medias = calcularMedias(resultadoHorario);
    mostrarDatos(localidad, medias);
  }

  if (resultadoDiario) {
    const previsionSemanal = procesarPrevisionDiaria(resultadoDiario);
    mostrarPrevisionSemanal(previsionSemanal);
  }
}

const selector = document.querySelector("#seleccionarLocalidad");


actualizarDatos(selector.value);


selector.addEventListener("change", (event) => {
    actualizarDatos(event.target.value);
});