import { create } from "zustand";

export type Vec3 = [number, number, number];

type CustomizerState = {
  imageUrl: string | null;
  imagePath: string | null;
  position: Vec3;
  rotation: number;
  scale: number;
  color: string;
  size: string;
  confirmed: boolean;
  setImage: (url: string | null, path: string | null) => void;
  setPosition: (p: Vec3) => void;
  setRotation: (r: number) => void;
  setScale: (s: number) => void;
  setColor: (c: string) => void;
  setSize: (s: string) => void;
  setConfirmed: (v: boolean) => void;
  hydrate: (values: Partial<CustomizerState>) => void;
  reset: () => void;
};

const initial = {
  imageUrl: null,
  imagePath: null,
  position: [0, 0.1, 0.05] as Vec3,
  rotation: 0,
  scale: 0.3,
  color: "#F2EFE7",
  size: "M",
  confirmed: false,
};

export const useCustomizerStore = create<CustomizerState>((set) => ({
  ...initial,
  setImage: (imageUrl, imagePath) => set({ imageUrl, imagePath }),
  setPosition: (position) => set({ position }),
  setRotation: (rotation) => set({ rotation }),
  setScale: (scale) => set({ scale }),
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),
  setConfirmed: (confirmed) => set({ confirmed }),
  hydrate: (values) => set(values),
  reset: () => set(initial),
}));
