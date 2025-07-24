import Image from "next/image";

export default function Page() {
  return (
    <div className="text-9xl font-bold text-center">
      <div>
        <Image
          src="/file.svg"
          alt="something"
          width={500}
          height={500}
          className="mx-auto mb-4"
        />
      </div>
    </div>
  );
}
