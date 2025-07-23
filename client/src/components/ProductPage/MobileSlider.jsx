import { useDispatch, useSelector } from "react-redux";
import { nextSlide, prevSlide } from "../../redux/reducers/productSlice";
import { getImageUrl } from "../../utils/imageUtils";

const MobileSlider = () => {
  const dispatch = useDispatch();
  const images = useSelector((state) => state.product.images);
  const slideIndex = useSelector((state) => state.product.slideIndex);

  const IMAGE_BASE_URL = process.env.REACT_APP_API_BASE_URL.replace('/api', '');
  return (
    <div className="slider overflow-hidden relative mt-1 bg-grayish-blue">
      <div
        className="images flex w-full sm:w-1/2 transition-all"
        style={{ transform: `translateX(-${100 * slideIndex}%)` }}
      >
        {images && images.length > 0 ? (
          images.map((img, index) => (
            <img
              className="object-cover"
              key={index}
              src={getImageUrl(img.image_url)}
              alt={`Product view ${index + 1}`}
            />
          ))
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-white">No Images Available</div>
        )}
      </div>
      {images && images.length > 1 && (
        <div className="directions absolute inset-x-0 inset-y-1/2 flex items-center justify-between mx-4">
          <button
            onClick={() => dispatch(prevSlide())}
            className="back-arrow w-10 h-10 bg-white rounded-full"
          >
            <i className="flex items-center justify-center m-auto text-lg">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </i>
          </button>
          <button
            onClick={() => dispatch(nextSlide())}
            className="next-arrow w-10 h-10 bg-white rounded-full"
          >
            <i className="flex items-center justify-center m-auto text-lg">
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </i>
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileSlider;
