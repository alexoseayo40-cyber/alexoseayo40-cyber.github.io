// FeedPlanner · lo común de las páginas de los enlaces (recetas compartidas e invitaciones).
// Todo lo que viene de la nube se pinta con textContent (nunca como HTML): lo ha escrito una persona.
"use strict";

const FP = {
  // Supabase de FeedPlanner. La clave es la PÚBLICA («anon»), la misma que lleva la app: con ella
  // solo se puede ver una publicación si se sabe su id (función ver_publicacion).
  URL: "https://venkbrybxidegoutqxtt.supabase.co",
  CLAVE: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbmticnlieGlkZWdvdXRxeHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwOTA5ODIsImV4cCI6MjEwNjY2Njk4Mn0.id35fOjRBLrNtlrv3d7w50pKx08syqPhfbALuUIVEBI",
  PAQUETE: "es.alexrm.feedplanner",
  get DESCARGA() { return this.URL + "/storage/v1/object/public/descargas/FeedPlanner.apk"; },

  ingles: (navigator.language || "es").toLowerCase().startsWith("en"),
  t(es, en) { return this.ingles && en ? en : es; },

  /** Un elemento con su texto (seguro: textContent) y sus clases. */
  el(etiqueta, texto, clase) {
    const e = document.createElement(etiqueta);
    if (texto != null) e.textContent = texto;
    if (clase) e.className = clase;
    return e;
  },

  /** Abre esta misma dirección en la app (si está instalada); si no, Chrome se queda aquí. */
  enlaceApp() {
    const u = new URL(location.href);
    return "intent://" + u.host + u.pathname + u.search +
      "#Intent;scheme=https;package=" + this.PAQUETE + ";end";
  },

  /** La ruta de una foto en `compartidas` → su dirección pública. Solo rutas con la forma de la app. */
  urlFoto(ruta) {
    if (typeof ruta !== "string" || !/^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/.test(ruta)) return null;
    return this.URL + "/storage/v1/object/public/compartidas/" + ruta;
  },

  async verPublicacion(id) {
    const r = await fetch(this.URL + "/rest/v1/rpc/ver_publicacion", {
      method: "POST",
      headers: { "apikey": this.CLAVE, "Authorization": "Bearer " + this.CLAVE, "Content-Type": "application/json" },
      body: JSON.stringify({ p_id: id }),
    });
    if (!r.ok) throw new Error("http " + r.status);
    return r.json();
  },

  /**
   * Lee una receta en el formato de texto de la app («# Nombre», «Clave: valor», «## Ingredientes»,
   * «- 300 g lentejas», «## Pasos», «1. Título: texto [10 min]»). Lo justo para enseñarla.
   */
  leerReceta(texto) {
    const r = { nombre: "", datos: {}, descripcion: [], ingredientes: [], pasos: [] };
    let seccion = "cabecera";
    for (const bruta of String(texto || "").replace(/\r/g, "").split("\n")) {
      const l = bruta.trim();
      if (!l) continue;
      if (l.startsWith("## ")) {
        const s = l.slice(3).toLowerCase();
        seccion = s.startsWith("ingred") ? "ingredientes" : s.startsWith("pas") || s.startsWith("step") ? "pasos" : "otra";
        continue;
      }
      if (l.startsWith("# ")) { r.nombre = l.slice(2).trim(); continue; }
      if (seccion === "cabecera") {
        const m = l.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑü ]{3,20}):\s*(.+)$/);
        if (m && r.descripcion.length === 0) r.datos[m[1].trim().toLowerCase()] = m[2].trim();
        else r.descripcion.push(l);
      } else if (seccion === "ingredientes") {
        r.ingredientes.push(l.replace(/^[-•*]\s*/, ""));
      } else if (seccion === "pasos") {
        const m = l.match(/^\d+[.)]\s*(.*)$/);
        const p = m ? m[1] : l;
        const tiempo = p.match(/\[([^\]]+)\]\s*$/);
        r.pasos.push({ texto: tiempo ? p.slice(0, tiempo.index).trim() : p, tiempo: tiempo ? tiempo[1] : null });
      }
    }
    return r;
  },

  /** Los datos que se enseñan como chips, en este orden. */
  chipsDe(datos) {
    const claves = [["tiempo", null], ["raciones", "raciones"], ["plato", null], ["cocina", null], ["aguanta", "aguanta"]];
    const fuera = [];
    for (const [k, prefijo] of claves) {
      const v = datos[k];
      if (!v) continue;
      if (prefijo === "raciones") fuera.push(this.t(v + " raciones", v + " servings"));
      else if (prefijo === "aguanta") fuera.push(this.t("Aguanta " + v, "Keeps " + v));
      else fuera.push(v);
    }
    return fuera;
  },

  /** Una receta entera: chips, descripción, ingredientes y pasos. */
  pintarReceta(contenedor, receta, conTitulo) {
    if (conTitulo) contenedor.append(this.el("h2", receta.nombre));
    const chips = this.chipsDe(receta.datos);
    if (chips.length) {
      const ul = this.el("ul", null, "chips");
      chips.forEach((c) => ul.append(this.el("li", c)));
      contenedor.append(ul);
    }
    if (receta.descripcion.length) contenedor.append(this.el("p", receta.descripcion.join("\n"), "descripcion"));
    const video = receta.datos["vídeo"] || receta.datos["video"];
    if (video && /^https:\/\/(youtu\.be|(www\.|m\.)?youtube\.com)\//.test(video)) {
      const a = this.el("a", this.t("Ver el vídeo", "Watch the video"));
      a.href = video; a.rel = "noopener nofollow"; a.target = "_blank";
      contenedor.append(a);
    }
    if (receta.ingredientes.length) {
      contenedor.append(this.el("h3", this.t("Ingredientes · ", "Ingredients · ") + receta.ingredientes.length));
      const caja = this.el("div", null, "tarjeta");
      const ul = this.el("ul", null, "ingredientes");
      receta.ingredientes.forEach((i) => ul.append(this.el("li", i)));
      caja.append(ul);
      contenedor.append(caja);
    }
    if (receta.pasos.length) {
      contenedor.append(this.el("h3", this.t("Pasos", "Steps")));
      const ol = this.el("ol", null, "pasos");
      receta.pasos.forEach((p) => {
        const li = this.el("li", p.texto);
        if (p.tiempo) { li.append(" "); li.append(this.el("span", "⏱ " + p.tiempo, "tiempo")); }
        ol.append(li);
      });
      contenedor.append(ol);
    }
    const fuente = receta.datos["fuente"];
    if (fuente) contenedor.append(this.el("p", this.t("Fuente: ", "Source: ") + fuente, "nota"));
  },

  /** «Abrir en FeedPlanner» y «Descargar FeedPlanner». */
  pintarBotones(contenedor, textoAbrir) {
    const caja = this.el("div", null, "botones");
    const abrir = this.el("a", textoAbrir, "boton");
    abrir.href = this.enlaceApp();
    const bajar = this.el("a", this.t("No tengo la app: descargar FeedPlanner", "I don't have the app: download FeedPlanner"), "boton secundario");
    bajar.href = this.DESCARGA;
    caja.append(abrir, bajar);
    contenedor.append(caja);
    contenedor.append(this.el("p", this.t(
      "FeedPlanner es una app para Android para hacer el menú de la semana, la lista de la compra y tu recetario. Ahora está en pruebas.",
      "FeedPlanner is an Android app for your weekly menu, shopping list and recipe book. It's in beta."), "nota"));
  },

  avatar(nombre) {
    return this.el("span", (nombre || "?").trim().charAt(0).toUpperCase(), "avatar");
  },
};
