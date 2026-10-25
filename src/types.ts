// Shared types used by the 3D layer, the interface and the content files.

// The rooms: the central rotunda plus the six rooms around it.
export type RoomId = 'rotunda' | 'hall' | 'ir1' | 'ir2' | 'ir3' | 'ir4' | 'quiz'

// The four era rooms; visiting all of them unlocks the quiz room.
export const ERA_ROOMS: RoomId[] = ['ir1', 'ir2', 'ir3', 'ir4']
