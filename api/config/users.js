const USUARIOS = {
  vet_lopez:     { pgUser: 'vet_lopez',     pgPass: 'vet_lopez_pass',    rol: 'veterinario', vet_id: 1 },
  vet_garcia:    { pgUser: 'vet_garcia',    pgPass: 'vet_garcia_pass',   rol: 'veterinario', vet_id: 2 },
  vet_mendez:    { pgUser: 'vet_mendez',    pgPass: 'vet_mendez_pass',   rol: 'veterinario', vet_id: 3 },
  recepcionista: { pgUser: 'recepcionista', pgPass: 'recepcion_pass',    rol: 'recepcion',   vet_id: null },
  administrador: { pgUser: 'administrador', pgPass: 'admin_pass',        rol: 'admin',       vet_id: null },
};

module.exports = USUARIOS;