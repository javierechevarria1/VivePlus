export const usuarioService = {
  pingOffline(userId: number): void {
    navigator.sendBeacon('/api/usuario/ping', JSON.stringify({ user_id: userId, offline: true }));
  },
};
