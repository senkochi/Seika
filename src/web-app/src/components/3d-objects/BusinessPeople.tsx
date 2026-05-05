import { Images } from "@/assets/images";

type BusinessPeopleProps = {
    size?: number;
};

function BusinessPeople({size = 544}: BusinessPeopleProps) {
  return (
        <div 
      className="overflow-hidden" 
      style={{ width: size, height: size * 0.8 }} // Giảm chiều cao khung chứa xuống còn 80%
    >
      <img 
        src={Images.BusinessPeople}  
        alt="Business People" 
        width={size} 
        height={size} 
        className="-mt-[20%] object-cover" // Đẩy ảnh thực tế lên trên 20% để giấu phần đầu
      />
    </div>
  )
}

export default BusinessPeople
