import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = (await api.get(`/products/${productId}`)).data;
      const stock: Stock = (await api.get(`/stock/${productId}`)).data;
      const item = cart.find(item => item.id === productId)
      if (!item) {
        const newCart = [
          ...cart,
          { ...product, amount: 1 },
        ];
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        if ((item.amount + 1) <= stock.amount) {
          const newCart = cart.map(productCart => {
            if (productCart.id === productId) {
              productCart.amount++;
            }
            return productCart;
          })
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const item = cart.find(item => item.id === productId)
      if (item) {
        const removedProduct = cart.filter(product => {
          if (product.id !== productId)
            return product;
        })
        setCart(removedProduct)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removedProduct));
      } else {
        throw Error;
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) throw Error;
      const stock: Stock = (await api.get(`/stock/${productId}`)).data;
      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
      } else {
        const newCart = cart.map(product => {
          if (product.id === productId)
            product.amount = amount;
          return product
        })
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
    } catch (err) {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
