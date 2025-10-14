import { ToastPosition, ToastTheme } from "@ngxpert/hot-toast";


export interface Messages {}

export interface MessagesOptions {
    dismissible: boolean;
    duration: number;
    autoClose: boolean;
    position: ToastPosition | undefined;
    icon?: string;
    theme?: ToastTheme | undefined;
}