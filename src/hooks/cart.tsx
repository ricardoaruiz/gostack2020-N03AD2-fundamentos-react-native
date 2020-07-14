import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const PRODUCTS_KEY = '@cart:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const storedProducts = await AsyncStorage.getItem(PRODUCTS_KEY);
      setProducts(
        storedProducts ? (JSON.parse(storedProducts) as Product[]) : [],
      );
    }

    loadProducts();
  }, []);

  const getProduct = useCallback(
    (
      id: string,
    ): {
      product: Product | undefined;
      index: number;
    } => {
      const prodIndex = products.findIndex(p => p.id === id);
      const prod = products.find(p => p.id === id);
      return { product: prod, index: prodIndex };
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const { product: prod, index } = getProduct(id);

      if (prod) {
        const incrementedProduct = { ...prod, quantity: prod.quantity + 1 };
        const newProducts = [...products];
        newProducts.splice(index, 1, incrementedProduct);
        setProducts(newProducts);
        await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
      }
    },
    [getProduct, products],
  );

  const decrement = useCallback(
    async id => {
      const { product: prod, index } = getProduct(id);

      if (prod) {
        if (prod.quantity - 1 === 0) {
          const newProducts = [...products];
          newProducts.splice(index, 1);
          setProducts(newProducts);
          await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
          return;
        }

        const incrementedProduct = { ...prod, quantity: prod.quantity - 1 };
        const newProducts = [...products];
        newProducts.splice(index, 1, incrementedProduct);
        setProducts(newProducts);
        await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
      }
    },
    [getProduct, products],
  );

  const addToCart = useCallback(
    async product => {
      const existProduct = products.find(prod => prod.id === product.id);
      if (!existProduct) {
        const newProducts = [...products, { ...product, quantity: 1 }];
        setProducts(newProducts);
        await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
      } else {
        increment(product.id);
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
