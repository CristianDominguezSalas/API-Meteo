function generarURL(localidad) {
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

    return `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&hourly=temperature_2m,precipitation_probability&timezone=auto`;
}


async function obtenerDatos(localidad) {
    try {
        const url = generarURL(localidad);
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


//Nueva función que centraliza todo el flujo
function actualizarDatos(localidad) {
  obtenerDatos(localidad).then((resultado) => {
    if (!resultado) return;
    const medias = calcularMedias(resultado);
    mostrarDatos(localidad, medias);
  });
}

//Cargamos los datos por primera vez
const selector = document.querySelector("#seleccionarLocalidad");
actualizarDatos(selector.value);

//Cuando el select cambie actualizamos la web
selector.addEventListener("change", (event) => {
    actualizarDatos(event.target.value);
});