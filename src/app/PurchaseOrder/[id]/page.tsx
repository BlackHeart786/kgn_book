// app/purchase-orders/[id]/page.tsx
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PurchaseOrderDetailPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  // In a real app: fetch PO details using 'id'
  // const [poDetails, setPoDetails] = useState(null);
  // useEffect(() => {
  //   fetch(`/api/purchase-orders/${id}`).then(res => res.json()).then(setPoDetails);
  // }, [id]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-4xl mx-auto bg-[#2D2E30] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Purchase Order Details: {id}</h1>
        <p className="text-gray-300 mb-4">
          This is where the detailed information for Purchase Order <span className="font-semibold text-blue-400">{id}</span> would be displayed.
          You would fetch data based on the ID from your backend.
        </p>
        {/* Example: Display some mock data or loading state */}
        {/* {poDetails ? (
            <div>... display PO details ...</div>
        ) : (
            <p>Loading PO details...</p>
        )} */}
        <div className="mt-8 flex space-x-4">
          <Link href="/purchase-orders" passHref>
            <button className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
              Back to List
            </button>
          </Link>
          <Link href={`/purchase-orders/${id}/edit`} passHref>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
              Edit PO
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;