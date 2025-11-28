export interface ReceiptExample {
  name: string;
  code: string;
}

export const RECEIPT_EXAMPLES: Record<string, ReceiptExample> = {
  simple: {
    name: "Simple Receipt",
    code: `<Document>
  <Page size={{ width: 227, height: 300 }} style={{ padding: 10 }}>
    <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
      MY STORE
    </Text>
    <Text style={{ textAlign: 'center', fontSize: 12 }}>
      123 Main Street
    </Text>
    <Text style={{ textAlign: 'center', fontSize: 12 }}>
      Tel: (11) 1234-5678
    </Text>

    <View style={{ borderBottom: '1px solid black', marginTop: 10, marginBottom: 10 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Coffee</Text>
      <Text>R$ 5.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Sandwich</Text>
      <Text>R$ 12.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Water</Text>
      <Text>R$ 3.00</Text>
    </View>

    <View style={{ borderTop: '1px dashed black', marginTop: 10, marginBottom: 10 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontWeight: 'bold' }}>TOTAL</Text>
      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>R$ 20.00</Text>
    </View>

    <View style={{ marginTop: 20 }}>
      <Text style={{ textAlign: 'center', fontSize: 12 }}>
        Thank you for your purchase!
      </Text>
    </View>
  </Page>
</Document>`,
  },

  restaurant: {
    name: "Restaurant",
    code: `<Document>
  <Page size={{ width: 227, height: 300 }} style={{ padding: 10 }}>
    <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>
      RESTAURANT XYZ
    </Text>
    <Text style={{ textAlign: 'center' }}>
      Fine Dining Experience
    </Text>
    <Text style={{ textAlign: 'center', fontSize: 12 }}>
      456 Gourmet Avenue
    </Text>

    <View style={{ borderBottom: '1px solid black', marginTop: 10 }} />

    <Text style={{ fontSize: 12, marginTop: 5 }}>
      Table: 12 | Server: Maria | 19:45
    </Text>

    <View style={{ borderBottom: '1px dashed black', marginTop: 5, marginBottom: 10 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>1x Bruschetta</Text>
      <Text>R$ 28.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>2x Pasta Carbonara</Text>
      <Text>R$ 96.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>1x Tiramisu</Text>
      <Text>R$ 32.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>2x Wine Glass</Text>
      <Text>R$ 60.00</Text>
    </View>

    <View style={{ borderTop: '1px solid black', marginTop: 10 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
      <Text>Subtotal</Text>
      <Text>R$ 216.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Service (10%)</Text>
      <Text>R$ 21.60</Text>
    </View>

    <View style={{ borderTop: '1px solid black', marginTop: 5 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 20 }}>TOTAL</Text>
      <Text style={{ fontWeight: 'bold', fontSize: 20 }}>R$ 237.60</Text>
    </View>

    <View style={{ marginTop: 20 }}>
      <Text style={{ textAlign: 'center', fontSize: 12 }}>
        Thank you for dining with us!
      </Text>
    </View>
  </Page>
</Document>`,
  },

  minimal: {
    name: "Minimal",
    code: `<Document>
  <Page size={{ width: 227, height: 300 }} style={{ padding: 10 }}>
    <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
      QUICK MART
    </Text>

    <View style={{ borderBottom: '1px solid black', marginTop: 5, marginBottom: 5 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Item 1</Text>
      <Text>R$ 10.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Item 2</Text>
      <Text>R$ 15.00</Text>
    </View>

    <View style={{ borderTop: '1px solid black', marginTop: 5 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
      <Text style={{ fontWeight: 'bold' }}>Total</Text>
      <Text style={{ fontWeight: 'bold' }}>R$ 25.00</Text>
    </View>
  </Page>
</Document>`,
  },

  cafe: {
    name: "Cafe (58mm)",
    code: `<Document>
  <Page size={{ width: 165, height: 300 }} style={{ padding: 10 }}>
    <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>
      CAFE
    </Text>

    <View style={{ borderBottom: '1px solid black', marginTop: 5 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Espresso</Text>
      <Text>R$5</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Croissant</Text>
      <Text>R$8</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Latte</Text>
      <Text>R$7</Text>
    </View>

    <View style={{ borderTop: '1px solid black', marginTop: 5 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontWeight: 'bold' }}>Total</Text>
      <Text style={{ fontWeight: 'bold' }}>R$20</Text>
    </View>

    <Text style={{ textAlign: 'center', fontSize: 12, marginTop: 10 }}>
      Thanks!
    </Text>
  </Page>
</Document>`,
  },
};
