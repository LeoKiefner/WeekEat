/**
 * Prix approximatifs par ingrédient (prix moyens marché français 2024)
 * Utilisé pour calculer le coût des recettes
 */
export const INGREDIENT_PRICES: Record<string, { pricePerUnit: number; unit: string }> = {
  // Légumes (prix au kg sauf indication)
  "Chou": { pricePerUnit: 2.5, unit: "kg" },
  "Chou vert": { pricePerUnit: 2.5, unit: "kg" },
  "Carottes": { pricePerUnit: 1.8, unit: "kg" },
  "Pommes de terre": { pricePerUnit: 1.5, unit: "kg" },
  "Céleri": { pricePerUnit: 3.0, unit: "kg" },
  "Céleri-rave": { pricePerUnit: 3.5, unit: "kg" },
  "Endives": { pricePerUnit: 2.8, unit: "kg" },
  "Poireaux": { pricePerUnit: 2.2, unit: "kg" },
  "Potiron": { pricePerUnit: 2.0, unit: "kg" },
  "Courgettes": { pricePerUnit: 2.5, unit: "kg" },
  "Tomates": { pricePerUnit: 3.5, unit: "kg" },
  "Oignon": { pricePerUnit: 1.5, unit: "kg" },
  "Oignons": { pricePerUnit: 1.5, unit: "kg" },
  "Ail": { pricePerUnit: 8.0, unit: "kg" },
  "Épinards": { pricePerUnit: 4.0, unit: "kg" },
  "Asperges": { pricePerUnit: 8.0, unit: "kg" },
  "Radis": { pricePerUnit: 3.0, unit: "kg" },
  "Haricots verts": { pricePerUnit: 4.5, unit: "kg" },

  // Fruits
  "Pommes": { pricePerUnit: 2.5, unit: "kg" },
  "Poires": { pricePerUnit: 2.8, unit: "kg" },

  // Produits laitiers
  "Crème fraîche": { pricePerUnit: 1.2, unit: "100ml" },
  "Crème": { pricePerUnit: 1.2, unit: "100ml" },
  "Fromage râpé": { pricePerUnit: 8.0, unit: "kg" },
  "Fromage à tartiflette": { pricePerUnit: 12.0, unit: "kg" },
  "Beurre": { pricePerUnit: 6.0, unit: "kg" },
  "Lait": { pricePerUnit: 0.9, unit: "L" },

  // Viandes et poissons
  "Jambon": { pricePerUnit: 15.0, unit: "kg" },
  "Bœuf": { pricePerUnit: 18.0, unit: "kg" },
  "Porc": { pricePerUnit: 12.0, unit: "kg" },
  "Poulet": { pricePerUnit: 8.0, unit: "kg" },
  "Saumon": { pricePerUnit: 20.0, unit: "kg" },
  "Thon": { pricePerUnit: 15.0, unit: "kg" },

  // Épicerie
  "Huile d'olive": { pricePerUnit: 8.0, unit: "L" },
  "Riz": { pricePerUnit: 2.5, unit: "kg" },
  "Pâtes": { pricePerUnit: 2.0, unit: "kg" },
  "Sucre": { pricePerUnit: 1.5, unit: "kg" },
  "Farine": { pricePerUnit: 1.2, unit: "kg" },
  "Sel": { pricePerUnit: 0.5, unit: "kg" },
  "Poivre": { pricePerUnit: 15.0, unit: "kg" },
  "Cannelle": { pricePerUnit: 25.0, unit: "kg" },

  // Pâtes et préparations
  "Pâte brisée": { pricePerUnit: 2.5, unit: "unité" },
  "Pâte feuilletée": { pricePerUnit: 3.0, unit: "unité" },
  "Béchamel": { pricePerUnit: 1.5, unit: "100ml" },

  // Œufs
  "Oeufs": { pricePerUnit: 0.25, unit: "unité" },
  "Œufs": { pricePerUnit: 0.25, unit: "unité" },
}

/**
 * Calcule le prix approximatif d'un ingrédient
 */
export function calculateIngredientPrice(
  name: string,
  quantity: number,
  unit: string
): number {
  const normalizedName = name.trim()
  const priceInfo = INGREDIENT_PRICES[normalizedName]

  if (!priceInfo) {
    // Prix par défaut si non trouvé (estimation basée sur la catégorie)
    return quantity * 0.01 // 1 centime par unité par défaut
  }

  // Convertir la quantité en unité de prix
  let quantityInPriceUnit = quantity

  // Conversions d'unités
  if (unit === "g" && priceInfo.unit === "kg") {
    quantityInPriceUnit = quantity / 1000
  } else if (unit === "ml" && priceInfo.unit === "L") {
    quantityInPriceUnit = quantity / 1000
  } else if (unit === "100ml" && priceInfo.unit === "L") {
    quantityInPriceUnit = quantity / 10
  } else if (unit === "cuillère à soupe" || unit === "cuillères à soupe") {
    // Approximation: 1 cuillère = 15ml
    if (priceInfo.unit === "L") {
      quantityInPriceUnit = (quantity * 15) / 1000
    } else {
      quantityInPriceUnit = quantity * 0.015 // Approximation
    }
  } else if (unit === "cuillère à café" || unit === "cuillères à café") {
    // Approximation: 1 cuillère = 5ml
    if (priceInfo.unit === "L") {
      quantityInPriceUnit = (quantity * 5) / 1000
    } else {
      quantityInPriceUnit = quantity * 0.005
    }
  }

  return priceInfo.pricePerUnit * quantityInPriceUnit
}
