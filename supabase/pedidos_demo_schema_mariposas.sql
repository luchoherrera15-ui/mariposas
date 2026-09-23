-- ============================================================================
--  Mariposas — pedidos demo (versión para el schema "mariposas")
--  Correlo SOLO después de registrarte en el sitio (/entrar).
-- ============================================================================
set search_path = mariposas, public, extensions;


do $bloque$
declare
  v_correo  text := 'CAMBIA_ESTO@correo.com';   -- <<<<<< TU CORREO AQUÍ
  v_cliente uuid;
  v_pedido  uuid;
  v_envio   uuid;
begin
  select id into v_cliente from auth.users where lower(email) = lower(v_correo);
  if v_cliente is null then
    raise exception 'No existe un usuario con el correo %. Registrate primero en /entrar y volvé a correr este script.', v_correo;
  end if;

  -- Borra los pedidos demo previos de este cliente para poder re-correr el script.
  delete from pedidos where cliente_id = v_cliente;

  -- ══ Pedido 1: ENTREGADO ══════════════════════════════════════════════════
  insert into pedidos (cliente_id, estado, total, moneda, notas, creado_en)
  values (v_cliente, 'entregado', 1268.00, 'USD', 'Exhibición de verano — entrega en dos tandas', now() - interval '62 days')
  returning id into v_pedido;

  insert into pedido_items (pedido_id, especie_id, cantidad, precio_unitario)
  select v_pedido, e.id, v.cant, e.precio_unitario
  from especies e
  join (values ('Morpho peleides', 80), ('Caligo memnon', 60), ('Danaus plexippus', 40)) as v(sci, cant)
    on v.sci = e.nombre_cientifico;

  insert into envios (pedido_id, transportista, numero_guia, url_rastreo, estado, origen, destino,
                      enviado_en, entrega_estimada, entregado_en, temperatura_c)
  values (v_pedido, 'DHL Express', 'DHL7742108833', 'https://www.dhl.com/es-es/home/rastreo.html?tracking-id=DHL7742108833',
          'entregado', 'San Rafael de Alajuela, CR', 'Miami, FL, USA',
          now() - interval '60 days', (now() - interval '56 days')::date, now() - interval '57 days', 14.5)
  returning id into v_envio;

  insert into envio_eventos (envio_id, ocurrido_en, estado, ubicacion, descripcion) values
    (v_envio, now() - interval '61 days', 'preparando',  'San Rafael de Alajuela, CR', 'Pupas seleccionadas y empacadas en frío'),
    (v_envio, now() - interval '60 days', 'en_transito', 'SJO Aeropuerto',  'Salida del centro de origen'),
    (v_envio, now() - interval '59 days', 'en_aduana',   'Miami, FL',       'Inspección USDA APHIS aprobada'),
    (v_envio, now() - interval '58 days', 'en_reparto',  'Miami, FL',       'En vehículo de reparto'),
    (v_envio, now() - interval '57 days', 'entregado',   'Miami, FL',       'Recibido por M. Álvarez. 180 pupas viables de 180');

  -- ══ Pedido 2: EN TRÁNSITO ════════════════════════════════════════════════
  insert into pedidos (cliente_id, estado, total, moneda, notas, creado_en)
  values (v_cliente, 'enviado', 894.50, 'USD', 'Reposición mensual', now() - interval '9 days')
  returning id into v_pedido;

  insert into pedido_items (pedido_id, especie_id, cantidad, precio_unitario)
  select v_pedido, e.id, v.cant, e.precio_unitario
  from especies e
  join (values ('Greta oto', 45), ('Siproeta stelenes', 50), ('Papilio thoas', 25)) as v(sci, cant)
    on v.sci = e.nombre_cientifico;

  insert into envios (pedido_id, transportista, numero_guia, url_rastreo, estado, origen, destino,
                      enviado_en, entrega_estimada, temperatura_c)
  values (v_pedido, 'FedEx International', 'FDX881204557719', 'https://www.fedex.com/fedextrack/?trknbr=FDX881204557719',
          'en_aduana', 'San Rafael de Alajuela, CR', 'Ámsterdam, NL',
          now() - interval '4 days', (now() + interval '2 days')::date, 13.8)
  returning id into v_envio;

  insert into envio_eventos (envio_id, ocurrido_en, estado, ubicacion, descripcion) values
    (v_envio, now() - interval '6 days', 'preparando',  'San Rafael de Alajuela, CR', 'Pedido confirmado, iniciando selección'),
    (v_envio, now() - interval '5 days', 'preparando',  'San Rafael de Alajuela, CR', '120 pupas empacadas con gel refrigerante'),
    (v_envio, now() - interval '4 days', 'en_transito', 'SJO Aeropuerto',  'Documentos CITES y fitosanitario emitidos'),
    (v_envio, now() - interval '2 days', 'en_transito', 'Madrid, ES',      'Escala técnica, cadena de frío estable'),
    (v_envio, now() - interval '1 days', 'en_aduana',   'Schiphol, NL',    'En revisión aduanal, sin observaciones');

  -- ══ Pedido 3: EN PREPARACIÓN ═════════════════════════════════════════════
  insert into pedidos (cliente_id, estado, total, moneda, notas, creado_en)
  values (v_cliente, 'preparando', 507.00, 'USD', 'Pedido para taller escolar', now() - interval '2 days')
  returning id into v_pedido;

  insert into pedido_items (pedido_id, especie_id, cantidad, precio_unitario)
  select v_pedido, e.id, v.cant, e.precio_unitario
  from especies e
  join (values ('Heliconius charithonia', 60), ('Diaethria astala', 30), ('Danaus plexippus', 25)) as v(sci, cant)
    on v.sci = e.nombre_cientifico;

  insert into envios (pedido_id, transportista, estado, origen, destino, entrega_estimada, temperatura_c)
  values (v_pedido, 'Por asignar', 'preparando', 'San Rafael de Alajuela, CR', 'Bogotá, CO', (now() + interval '8 days')::date, 15.0)
  returning id into v_envio;

  insert into envio_eventos (envio_id, ocurrido_en, estado, ubicacion, descripcion) values
    (v_envio, now() - interval '2 days', 'preparando', 'San Rafael de Alajuela, CR', 'Pedido recibido, coordinando el acopio'),
    (v_envio, now() - interval '6 hours','preparando', 'San Rafael de Alajuela, CR', 'Pupas recibidas del criadero, 115 de 115 sanas');

  -- ══ Pedido 4: PENDIENTE (sin envío todavía) ══════════════════════════════
  insert into pedidos (cliente_id, estado, total, moneda, notas, creado_en)
  values (v_cliente, 'pendiente', 340.00, 'USD', 'Cotización aprobada, a la espera del anticipo', now() - interval '10 hours')
  returning id into v_pedido;

  insert into pedido_items (pedido_id, especie_id, cantidad, precio_unitario)
  select v_pedido, e.id, v.cant, e.precio_unitario
  from especies e
  join (values ('Morpho peleides', 40)) as v(sci, cant)
    on v.sci = e.nombre_cientifico;

  -- Recalcula los totales a partir de los items, por si cambiaste precios.
  update pedidos p
  set total = sub.suma
  from (
    select pedido_id, sum(cantidad * precio_unitario) as suma
    from pedido_items group by pedido_id
  ) sub
  where sub.pedido_id = p.id and p.cliente_id = v_cliente;

  raise notice 'Listo: 4 pedidos demo creados para %', v_correo;
end
$bloque$;
