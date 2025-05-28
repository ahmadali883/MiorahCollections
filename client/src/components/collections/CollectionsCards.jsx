import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getProductsByCollection } from '../../redux/reducers/productSlice';

// Dummy images for categories
const categoryImages = {
  bracelet: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&auto=format&fit=crop&q=60',
  necklace: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
  rings: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60',
  earrings: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&auto=format&fit=crop&q=60',
  pendants: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&auto=format&fit=crop&q=60',
  handcuffs: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
  'bridal-sets': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60'
};

const CollectionsCards = () => {
  const dispatch = useDispatch();

  const categories = [
    { name: 'Bracelet', id: 'bracelet' },
    { name: 'Necklace', id: 'necklace' },
    { name: 'Rings', id: 'rings' },
    { name: 'Earrings', id: 'earrings' },
    { name: 'Pendants', id: 'pendants' },
    { name: 'Handcuffs', id: 'handcuffs' },
    { name: 'Bridal Sets', id: 'bridal-sets' }
  ];

  return (
    <div className='collections-wrapper flex flex-wrap mt-12 justify-center mb-3 lg:mb-12'>
      {categories.map((category) => (
        <Link 
          key={category.id}
          to={`/collections/?collection=${category.id}`} 
          onClick={() => dispatch(getProductsByCollection(category.id))}
        >
          <div
            before={category.name}
            className='w-[15rem] bg-pale-orange xl:w-[19.5rem] text-pale-orange text-xl md:text-2xl uppercase cursor-pointer h-48 xl:h-60 border border-grayish-blue rounded-md mx-4 mb-10 flex items-center justify-center relative after:content-[attr(before)] after:absolute after:flex after:w-full after:justify-center after:opacity-0 hover:after:opacity-100 before:absolute before:bg-[rgba(255,_125,_27,_0.9)] before:inset-0 text-center before:h-0 hover:before:h-full before:transition-all'
          >
            <picture className='mx-auto'>
              <img 
                src={categoryImages[category.id]} 
                alt={`${category.name} collection`} 
                className='p-4 xl:p-0 w-full h-full object-cover'
              />
            </picture>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CollectionsCards;
