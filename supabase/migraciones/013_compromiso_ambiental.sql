-- ============================================================================
--  Compromiso ambiental: sin cifras inventadas.
--  - Se borran los registros de impacto de ejemplo (las siembras reales se
--    cargan desde /admin/impacto cuando ocurran).
--  - Queda un solo proyecto activo: árboles nativos, 1 por cada 10 pupas.
--    Los demás se desactivan (no se borran: se pueden reactivar en /admin).
-- ============================================================================

set search_path = mariposas, public, extensions;

delete from impacto_registros;

update proyectos_sociales set activo = false where slug <> 'arboles-nativos';

update proyectos_sociales set
  nombre = 'Árboles nativos',
  descripcion = 'Compramos semillas de especies nativas y de plantas hospederas de mariposas, las germinamos en vivero y sembramos los árboles con productores y comunidades de la zona.',
  unidad = 'árboles',
  unidad_singular = 'árbol',
  meta_anual = null,
  activo = true,
  orden = 1,
  traducciones = '{
    "en": {"nombre": "Native trees", "descripcion": "We buy seeds of native species and butterfly host plants, germinate them in a nursery and plant the trees with local growers and communities.", "unidad": "trees", "unidad_singular": "tree"},
    "it": {"nombre": "Alberi autoctoni", "descripcion": "Acquistiamo semi di specie autoctone e di piante nutrici delle farfalle, li facciamo germinare in vivaio e piantiamo gli alberi con coltivatori e comunità locali.", "unidad": "alberi", "unidad_singular": "albero"},
    "fr": {"nombre": "Arbres indigènes", "descripcion": "Nous achetons des graines d''espèces indigènes et de plantes hôtes des papillons, nous les faisons germer en pépinière et plantons les arbres avec des producteurs et des communautés locales.", "unidad": "arbres", "unidad_singular": "arbre"},
    "zh": {"nombre": "本土树木", "descripcion": "我们购买本土树种及蝴蝶寄主植物的种子，在苗圃育苗，再与当地种植者和社区一起种下。", "unidad": "棵树", "unidad_singular": "棵树"}
  }'::jsonb
where slug = 'arboles-nativos';

-- La regla: cada 10 pupas vendidas = 1 árbol.
delete from reglas_impacto where proyecto_id = (select id from proyectos_sociales where slug = 'arboles-nativos');
insert into reglas_impacto (proyecto_id, mariposas_por_bloque, unidades_por_bloque)
select id, 10, 1 from proyectos_sociales where slug = 'arboles-nativos';
