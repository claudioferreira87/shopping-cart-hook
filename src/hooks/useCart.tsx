import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
	children: ReactNode;
}

interface UpdateProductAmount {
	productId: number;
	amount: number;
}

interface CartContextData {
	cart: Product[];
	addProduct: (productId: number) => Promise<void>;
	removeProduct: (productId: number) => void;
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(() => {
		const storagedCart = localStorage.getItem('@RocketShoes:cart');

		if (storagedCart) {
			return JSON.parse(storagedCart);
		}

		return [];
	});

	const addProduct = async (productId: number) => {
		try {
			const productFounded = cart.find(item => item.id === productId);

			if (!productFounded) {
				const { data: product } = await api.get(`products/${productId}`);
				product.amount = 1;
				setCart([...cart, product]);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));
			} else {
				const { data: stock } = await api.get(`stock/${productId}`);
				if (stock.amount <= productFounded.amount) {
					toast.error('Quantidade solicitada fora de estoque');
					return;
				}
				const newCartAmount = cart.map(cart => {
					if (cart.id === productId) {
						cart.amount += 1;
					}
					return cart;
				});
				setCart(newCartAmount);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartAmount));
			}
		} catch {
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const existProduct = cart.find(product => product.id === productId);
			if (existProduct) {
				const newCart = cart.filter(product => product.id !== productId);
				setCart(newCart);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
			} else {
				toast.error('Erro na remoção do produto');
			}
		} catch {
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
			const { data: stock } = await api.get(`stock/${productId}`);
			if (amount <= stock.amount && amount > 0) {
				const newCart = cart.map(cart => {
					if (cart.id === productId) {
						cart.amount = amount;
					}
					return cart;
				});

				setCart(newCart);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
			} else {
				toast.error('Quantidade solicitada fora de estoque');
			}
		} catch {
			toast.error('Erro na alteração de quantidade do produto');
			return;
		}
	};

	return (
		<CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
			{children}
		</CartContext.Provider>
	);
}

export function useCart(): CartContextData {
	const context = useContext(CartContext);

	return context;
}
